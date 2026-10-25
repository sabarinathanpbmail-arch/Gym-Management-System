import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.net.URLEncoder;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.catalyst.advanced.CatalystAdvancedIOHandler;
import com.zc.common.ZCProject;
import com.zc.component.mail.ZCMail;
import com.zc.component.mail.ZCMailContent;
import com.zc.component.object.ZCObject;
import com.zc.component.object.ZCRowObject;
import com.zc.component.object.ZCTable;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Catalyst Advanced I/O Serverless Handler for Aurum Gym Management System
 * Pure Java backend integrating directly with Zoho Catalyst Data Store tables.
 */
public class Sample implements CatalystAdvancedIOHandler {
    private static final Logger LOGGER = Logger.getLogger(Sample.class.getName());

    @Override
    public void runner(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String method = request.getMethod();
        String origin = request.getHeader("Origin");

        // 1. CORS Headers
        if (origin != null && !origin.trim().isEmpty()) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        } else {
            response.setHeader("Access-Control-Allow-Origin", "*");
        }
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-email, x-user-id, x-gym-name");

        if ("OPTIONS".equalsIgnoreCase(method)) {
            response.setStatus(204);
            return;
        }

        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        // 2. Initialize Catalyst SDK
        try {
            ZCProject.initProject();
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "ZCProject init: " + e.getMessage());
        }

        // 3. Clean Path
        String path = cleanPath(request.getRequestURI());
        LOGGER.info("[Java API] " + method + " " + path);

        try {
            ZCObject zcObject = ZCObject.getInstance();

            // -------------------------------------------------------------
            // 0. HEALTH CHECK & ROOT
            // -------------------------------------------------------------
            if (("/".equals(path) || "/health".equals(path)) && "GET".equalsIgnoreCase(method)) {
                JSONObject res = new JSONObject();
                res.put("status", "online");
                res.put("service", "Aurum Gym Management System Java Serverless API");
                res.put("version", "2.0.0");
                res.put("stack", "java21");
                out.print(res.toString());
                return;
            }

            // -------------------------------------------------------------
            // 1. AUTHENTICATION & IDENTITY
            // -------------------------------------------------------------
            if ("/auth/me".equals(path) && "GET".equalsIgnoreCase(method)) {
                String headerEmail = request.getHeader("x-user-email");
                String headerId = request.getHeader("x-user-id");
                String queryEmail = request.getParameter("email");
                String cookieEmail = null;

                if (request.getCookies() != null) {
                    for (Cookie c : request.getCookies()) {
                        if ("gym_session".equals(c.getName())) {
                            try {
                                String decoded = new String(Base64.getDecoder().decode(c.getValue()));
                                JSONObject sess = new JSONObject(decoded);
                                cookieEmail = sess.optString("email", null);
                            } catch (Exception ignored) {}
                        }
                    }
                }

                String targetEmail = headerEmail != null ? headerEmail : (cookieEmail != null ? cookieEmail : queryEmail);
                ZCTable usersTable = zcObject.getTable("GymUsers");
                List<ZCRowObject> allUsers = usersTable.getAllRows();

                JSONObject matched = null;
                for (ZCRowObject row : allUsers) {
                    JSONObject u = rowToJson(row);
                    if (headerId != null && headerId.equals(String.valueOf(u.opt("ROWID")))) {
                        matched = u;
                        break;
                    }
                    if (targetEmail != null && targetEmail.equalsIgnoreCase(u.optString("email"))) {
                        matched = u;
                        break;
                    }
                }

                JSONObject res = new JSONObject();
                if (matched != null) {
                    String userGym = resolveGymName(matched, allUsers);
                    matched.put("gymName", userGym);
                    matched.put("gym_name", userGym);
                    res.put("status", "success");
                    res.put("authenticated", true);
                    JSONObject data = new JSONObject();
                    data.put("user", matched);
                    res.put("data", data);
                } else {
                    res.put("status", "success");
                    res.put("authenticated", false);
                    res.put("user", JSONObject.NULL);
                }
                out.print(res.toString());
                return;
            }

            if ("/auth/login".equals(path) && "POST".equalsIgnoreCase(method)) {
                JSONObject body = parseBody(request);
                String email = body.optString("email", "").trim().toLowerCase();

                if (email.isEmpty()) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Email is required").toString());
                    return;
                }

                ZCTable usersTable = zcObject.getTable("GymUsers");
                List<ZCRowObject> allUsers = usersTable.getAllRows();
                JSONObject matched = null;

                for (ZCRowObject row : allUsers) {
                    JSONObject u = rowToJson(row);
                    if (email.equalsIgnoreCase(u.optString("email"))) {
                        matched = u;
                        break;
                    }
                }

                if (matched == null) {
                    response.setStatus(401);
                    out.print(new JSONObject().put("status", "error").put("message", "No account found with this email: " + email).toString());
                    return;
                }

                if ("Inactive".equalsIgnoreCase(matched.optString("status"))) {
                    response.setStatus(403);
                    out.print(new JSONObject().put("status", "error").put("message", "Account deactivated. Contact gym owner.").toString());
                    return;
                }

                if ("PENDING_OTP".equalsIgnoreCase(matched.optString("status"))) {
                    response.setStatus(403);
                    out.print(new JSONObject()
                            .put("status", "error")
                            .put("code", "OTP_REQUIRED")
                            .put("message", "Your Gym Owner account requires OTP verification before login. Please enter the verification code sent to your email.")
                            .put("email", email)
                            .toString());
                    return;
                }

                if ("Pending".equalsIgnoreCase(matched.optString("status")) || "SENT".equalsIgnoreCase(matched.optString("status"))) {
                    response.setStatus(403);
                    out.print(new JSONObject()
                            .put("status", "error")
                            .put("code", "INVITATION_PENDING")
                            .put("message", "Your account invitation is pending password setup. Please check your email inbox and click the 'Set Your Password' link to activate access.")
                            .put("email", email)
                            .toString());
                    return;
                }

                String inputPass = body.optString("password", "").trim();
                String storedHash = matched.optString("password_hash", "");
                if (!storedHash.isEmpty() && !inputPass.isEmpty()) {
                    String inputHash = Base64.getEncoder().encodeToString(inputPass.getBytes());
                    if (!storedHash.equals(inputHash)) {
                        response.setStatus(401);
                        out.print(new JSONObject().put("status", "error").put("message", "Invalid email or password.").toString());
                        return;
                    }
                }

                // Create session payload
                JSONObject session = new JSONObject();
                session.put("rowid", matched.opt("ROWID"));
                session.put("email", matched.optString("email"));
                session.put("role", matched.optString("role"));
                String b64 = Base64.getEncoder().encodeToString(session.toString().getBytes());

                Cookie cookie = new Cookie("gym_session", b64);
                cookie.setPath("/");
                cookie.setMaxAge(2592000);
                response.addCookie(cookie);

                // Auto-record member attendance on login if no record today
                if ("Member".equalsIgnoreCase(matched.optString("role"))) {
                    try {
                        ZCTable attTable = zcObject.getTable("Attendance");
                        SimpleDateFormat istDateFmt = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);
                        istDateFmt.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));
                        SimpleDateFormat istTimeFmt = new SimpleDateFormat("hh:mm a", Locale.ENGLISH);
                        istTimeFmt.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));

                        String todayStr = istDateFmt.format(new Date());
                        String memberIdStr = String.valueOf(matched.opt("ROWID"));
                        List<ZCRowObject> allAtt = attTable.getAllRows();
                        boolean hasToday = false;
                        for (ZCRowObject ar : allAtt) {
                            JSONObject aj = rowToJson(ar);
                            if (memberIdStr.equals(aj.optString("memberId")) && todayStr.equals(aj.optString("attendanceDate"))) {
                                hasToday = true;
                                break;
                            }
                        }
                        if (!hasToday) {
                            ZCRowObject attRow = ZCRowObject.getInstance();
                            attRow.set("memberId", memberIdStr);
                            attRow.set("memberName", matched.optString("name", "Member"));
                            attRow.set("attendanceDate", todayStr);
                            attRow.set("checkInTime", istTimeFmt.format(new Date()));
                            attRow.set("checkOutTime", "In Session");
                            attRow.set("status", "Checked In");
                            attTable.insertRow(attRow);
                            LOGGER.info("[LOGIN ATTENDANCE] Auto-recorded check-in for member: " + matched.optString("email") + " at " + istTimeFmt.format(new Date()));
                        }
                    } catch (Exception attEx) {
                        LOGGER.warning("[LOGIN ATTENDANCE] Auto-checkin failed: " + attEx.getMessage());
                    }
                }

                String userGym = resolveGymName(matched, allUsers);
                matched.put("gymName", userGym);
                matched.put("gym_name", userGym);

                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("authenticated", true);
                res.put("user", matched);
                res.put("message", "Welcome back, " + matched.optString("name") + "!");
                out.print(res.toString());
                return;
            }

            if ("/auth/logout".equals(path) && "POST".equalsIgnoreCase(method)) {
                Cookie cookie = new Cookie("gym_session", "");
                cookie.setPath("/");
                cookie.setMaxAge(0);
                response.addCookie(cookie);

                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("message", "Logged out successfully");
                out.print(res.toString());
                return;
            }

            // -----------------------------------------------------------------
            // CUSTOM OTP REGISTRATION & VERIFICATION BUSINESS LOGIC
            // -----------------------------------------------------------------
            if ("/auth/signup-owner".equals(path) && "POST".equalsIgnoreCase(method)) {
                JSONObject body = parseBody(request);
                String email = body.optString("email", "").trim().toLowerCase();
                String firstName = body.optString("firstName", "").trim();
                String lastName = body.optString("lastName", "").trim();
                String phone = body.optString("phone", "").trim();
                String gymName = body.optString("gymName", "").trim();
                String password = body.optString("password", "").trim();

                String fullName = firstName + (lastName.isEmpty() ? "" : " " + lastName);
                if (email.isEmpty() || fullName.isEmpty()) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Name and email are required.").toString());
                    return;
                }

                ZCTable usersTable = zcObject.getTable("GymUsers");
                List<ZCRowObject> allUsers = usersTable.getAllRows();
                ZCRowObject existingRow = null;

                for (ZCRowObject row : allUsers) {
                    JSONObject u = rowToJson(row);
                    if (email.equalsIgnoreCase(u.optString("email"))) {
                        if ("Active".equalsIgnoreCase(u.optString("status"))) {
                            response.setStatus(409);
                            out.print(new JSONObject().put("status", "error").put("message", "An active Gym Owner account with this email already exists. Please sign in.").toString());
                            return;
                        }
                        existingRow = row;
                        break;
                    }
                }

                // Generate 6-digit OTP and 10-minute expiry
                String otp = generateOtp();
                long expiry = System.currentTimeMillis() + (10 * 60 * 1000); // 10 minutes
                String tokenPayload = "OTP:" + otp + ":" + expiry;

                String passwordHash = "";
                if (!password.isEmpty()) {
                    passwordHash = Base64.getEncoder().encodeToString(password.getBytes());
                }

                if (existingRow != null) {
                    // Update existing pending row
                    existingRow.set("name", fullName);
                    existingRow.set("phone", phone);
                    existingRow.set("role", "Owner");
                    existingRow.set("status", "PENDING_OTP");
                    String gymContact = gymName.isEmpty() ? "None" : (gymName.toLowerCase().startsWith("gym:") ? gymName : "Gym: " + gymName);
                    existingRow.set("emergencyContact", gymContact);
                    existingRow.set("invitation_token", tokenPayload);
                    if (!passwordHash.isEmpty()) {
                        existingRow.set("password_hash", passwordHash);
                    }
                    ArrayList<ZCRowObject> updateList = new ArrayList<>();
                    updateList.add(existingRow);
                    usersTable.updateRows(updateList);
                } else {
                    // Insert fresh pending row
                    ZCRowObject newRow = ZCRowObject.getInstance();
                    newRow.set("name", fullName);
                    newRow.set("email", email);
                    newRow.set("phone", phone);
                    newRow.set("role", "Owner");
                    newRow.set("status", "PENDING_OTP");
                    newRow.set("assignedTrainer", "None");
                    String gymContact = gymName.isEmpty() ? "None" : (gymName.toLowerCase().startsWith("gym:") ? gymName : "Gym: " + gymName);
                    newRow.set("emergencyContact", gymContact);
                    newRow.set("joinedDate", new SimpleDateFormat("yyyy-MM-dd").format(new Date()));
                    newRow.set("invitation_token", tokenPayload);
                    if (!passwordHash.isEmpty()) {
                        newRow.set("password_hash", passwordHash);
                    }
                    usersTable.insertRow(newRow);
                }

                // Send the OTP email via SMTP / Catalyst Mail
                boolean emailSent = sendOtpEmail(email, fullName, gymName, otp);

                if (!emailSent) {
                    LOGGER.warning("[OTP DISPATCH] Failed to deliver OTP email to: " + email);
                    response.setStatus(502);
                    JSONObject err = new JSONObject();
                    err.put("status", "error");
                    err.put("message", "We could not send the verification code to " + email + ". Please ensure your email is valid and check spam/junk folders.");
                    out.print(err.toString());
                    return;
                }

                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("step", "otp");
                res.put("email", email);
                res.put("message", "A 6-digit verification code has been sent to your email inbox (" + email + "). Please enter it below to verify your account.");
                response.setStatus(200);
                out.print(res.toString());
                return;
            }

            if ("/auth/verify-owner-otp".equals(path) && "POST".equalsIgnoreCase(method)) {
                JSONObject body = parseBody(request);
                String email = body.optString("email", "").trim().toLowerCase();
                String inputOtp = body.optString("otp", "").trim();

                if (email.isEmpty() || inputOtp.isEmpty()) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Email and 6-digit OTP code are required.").toString());
                    return;
                }

                ZCTable usersTable = zcObject.getTable("GymUsers");
                List<ZCRowObject> allUsers = usersTable.getAllRows();
                ZCRowObject matchedRow = null;
                JSONObject matched = null;

                for (ZCRowObject row : allUsers) {
                    JSONObject u = rowToJson(row);
                    if (email.equalsIgnoreCase(u.optString("email"))) {
                        matchedRow = row;
                        matched = u;
                        break;
                    }
                }

                if (matchedRow == null || matched == null) {
                    response.setStatus(404);
                    out.print(new JSONObject().put("status", "error").put("message", "No registration record found for " + email).toString());
                    return;
                }

                String token = matched.optString("invitation_token", "");
                if (token.isEmpty() || !token.startsWith("OTP:")) {
                    if ("Active".equalsIgnoreCase(matched.optString("status"))) {
                        matched.put("user_status", "Active");
                        JSONObject session = new JSONObject();
                        session.put("rowid", matched.opt("ROWID"));
                        session.put("email", matched.optString("email"));
                        session.put("role", "Owner");
                        String b64 = Base64.getEncoder().encodeToString(session.toString().getBytes());

                        Cookie cookie = new Cookie("gym_session", b64);
                        cookie.setPath("/");
                        cookie.setMaxAge(2592000);
                        response.addCookie(cookie);

                        JSONObject res = new JSONObject();
                        res.put("status", "success");
                        res.put("verified", true);
                        res.put("authenticated", true);
                        res.put("message", "Account already verified. Welcome back!");
                        JSONObject data = new JSONObject();
                        data.put("user", matched);
                        data.put("role", "Owner");
                        res.put("data", data);
                        out.print(res.toString());
                        return;
                    }

                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "No pending OTP verification found. Please request a new code.").toString());
                    return;
                }

                // Token format: "OTP:<6-digit-code>:<expiry-timestamp>"
                String[] parts = token.split(":");
                if (parts.length < 3) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Malformed verification token. Please request a new code.").toString());
                    return;
                }

                String storedOtp = parts[1].trim();
                long expiry = 0L;
                try {
                    expiry = Long.parseLong(parts[2].trim());
                } catch (Exception ignored) {}

                if (System.currentTimeMillis() > expiry) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Verification code has expired. Please click Resend Code to receive a fresh code.").toString());
                    return;
                }

                if (!storedOtp.equals(inputOtp)) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Incorrect verification code. Please check your inbox and try again.").toString());
                    return;
                }

                // OTP is valid! Activate account
                matchedRow.set("status", "Active");
                matchedRow.set("invitation_token", "VERIFIED");
                ArrayList<ZCRowObject> updateList = new ArrayList<>();
                updateList.add(matchedRow);
                usersTable.updateRows(updateList);

                matched.put("status", "Active");
                matched.put("user_status", "Active");
                matched.put("role", "Owner");
                matched.put("user_role", "Owner");

                // Issue session cookie
                JSONObject session = new JSONObject();
                session.put("rowid", matched.opt("ROWID"));
                session.put("email", matched.optString("email"));
                session.put("role", "Owner");
                String b64 = Base64.getEncoder().encodeToString(session.toString().getBytes());

                Cookie cookie = new Cookie("gym_session", b64);
                cookie.setPath("/");
                cookie.setMaxAge(2592000);
                response.addCookie(cookie);

                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("verified", true);
                res.put("authenticated", true);
                res.put("message", "Owner account verified successfully! Welcome to your Gym Owner Dashboard.");
                JSONObject data = new JSONObject();
                data.put("user", matched);
                data.put("role", "Owner");
                res.put("data", data);
                out.print(res.toString());
                return;
            }

            if ("/auth/resend-owner-otp".equals(path) && "POST".equalsIgnoreCase(method)) {
                JSONObject body = parseBody(request);
                String email = body.optString("email", "").trim().toLowerCase();

                if (email.isEmpty()) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Email is required.").toString());
                    return;
                }

                ZCTable usersTable = zcObject.getTable("GymUsers");
                List<ZCRowObject> allUsers = usersTable.getAllRows();
                ZCRowObject matchedRow = null;
                JSONObject matched = null;

                for (ZCRowObject row : allUsers) {
                    JSONObject u = rowToJson(row);
                    if (email.equalsIgnoreCase(u.optString("email"))) {
                        matchedRow = row;
                        matched = u;
                        break;
                    }
                }

                if (matchedRow == null || matched == null) {
                    response.setStatus(404);
                    out.print(new JSONObject().put("status", "error").put("message", "No account found with this email.").toString());
                    return;
                }

                if ("Active".equalsIgnoreCase(matched.optString("status"))) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Account is already verified. Please sign in.").toString());
                    return;
                }

                String otp = generateOtp();
                long expiry = System.currentTimeMillis() + (10 * 60 * 1000);
                String tokenPayload = "OTP:" + otp + ":" + expiry;

                matchedRow.set("invitation_token", tokenPayload);
                ArrayList<ZCRowObject> updateList = new ArrayList<>();
                updateList.add(matchedRow);
                usersTable.updateRows(updateList);

                String name = matched.optString("name", "Gym Owner");
                String gym = matched.optString("emergencyContact", "Aurum Fitness Club");

                boolean sent = sendOtpEmail(email, name, gym, otp);

                if (!sent) {
                    LOGGER.warning("[OTP DISPATCH] Failed to resend OTP email to: " + email);
                    response.setStatus(502);
                    JSONObject err = new JSONObject();
                    err.put("status", "error");
                    err.put("message", "We could not deliver a new verification code to " + email + ". Please check your email configuration.");
                    out.print(err.toString());
                    return;
                }

                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("message", "A new 6-digit verification code has been dispatched to your email inbox (" + email + ").");
                out.print(res.toString());
                return;
            }

            if ("/auth/invite".equals(path) && "POST".equalsIgnoreCase(method)) {
                JSONObject body = parseBody(request);
                String email = body.optString("email", "").trim().toLowerCase();
                String firstName = body.optString("firstName", "").trim();
                String lastName = body.optString("lastName", "").trim();
                String phone = body.optString("phone", "").trim();
                String role = body.optString("role", "Member").trim();
                String gymName = body.optString("gymName", "").trim();
                String emergency = body.optString("emergencyContact", "").trim();
                String assignedTrainer = body.optString("assignedTrainer", "").trim();

                String fullName = firstName + (lastName.isEmpty() ? "" : " " + lastName);
                if (email.isEmpty() || fullName.isEmpty()) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Name and email are required for invitation.").toString());
                    return;
                }

                ZCTable usersTable = zcObject.getTable("GymUsers");
                List<ZCRowObject> allUsers = usersTable.getAllRows();

                // Dynamically resolve facility gym name if not explicitly provided or generic
                if (gymName.isEmpty() || "Aurum Fitness Club".equalsIgnoreCase(gymName) || "Fitness Club".equalsIgnoreCase(gymName) || "Fitness Center".equalsIgnoreCase(gymName)) {
                    String callerEmail = request.getHeader("x-user-email");
                    JSONObject callerObj = null;
                    if (callerEmail != null) {
                        for (ZCRowObject r : allUsers) {
                            JSONObject u = rowToJson(r);
                            if (callerEmail.equalsIgnoreCase(u.optString("email"))) {
                                callerObj = u;
                                break;
                            }
                        }
                    }
                    gymName = resolveGymName(callerObj, allUsers);
                }

                ZCRowObject existingRow = null;

                for (ZCRowObject row : allUsers) {
                    JSONObject u = rowToJson(row);
                    if (email.equalsIgnoreCase(u.optString("email"))) {
                        if ("Active".equalsIgnoreCase(u.optString("status")) && "ACTIVATED".equalsIgnoreCase(u.optString("invitation_token"))) {
                            response.setStatus(409);
                            out.print(new JSONObject().put("status", "error").put("message", "An active account with email " + email + " already exists. User can sign in directly.").toString());
                            return;
                        }
                        existingRow = row;
                        break;
                    }
                }

                // Generate secure single-use invitation token with 48h expiration
                String token = UUID.randomUUID().toString().replace("-", "");
                long expiry = System.currentTimeMillis() + (48L * 60 * 60 * 1000); // 48 hours
                String tokenPayload = "INVITE:" + token + ":" + expiry;

                // Build password setup link with token & email
                String baseUrl = "https://gym-management-system-60089931848.development.catalystserverless.in/app/index.html";
                String setPasswordUrl = baseUrl + "#/set-password?token=" + token + "&email=" + URLEncoder.encode(email, "UTF-8");

                String assignedEmergency = emergency.isEmpty() ? (gymName.toLowerCase().startsWith("gym:") ? gymName : "Gym: " + gymName) : emergency;

                ZCRowObject targetRow;
                if (existingRow != null) {
                    existingRow.set("name", fullName);
                    existingRow.set("phone", phone);
                    existingRow.set("role", role);
                    existingRow.set("status", "Pending");
                    existingRow.set("assignedTrainer", "Trainer".equalsIgnoreCase(role) ? "Self" : (assignedTrainer.isEmpty() ? "None" : assignedTrainer));
                    existingRow.set("emergencyContact", assignedEmergency);
                    existingRow.set("invitation_token", tokenPayload);
                    ArrayList<ZCRowObject> ul = new ArrayList<>();
                    ul.add(existingRow);
                    usersTable.updateRows(ul);
                    targetRow = existingRow;
                } else {
                    ZCRowObject newRow = ZCRowObject.getInstance();
                    newRow.set("name", fullName);
                    newRow.set("email", email);
                    newRow.set("phone", phone);
                    newRow.set("role", role);
                    newRow.set("status", "Pending");
                    newRow.set("assignedTrainer", "Trainer".equalsIgnoreCase(role) ? "Self" : (assignedTrainer.isEmpty() ? "None" : assignedTrainer));
                    newRow.set("emergencyContact", assignedEmergency);
                    newRow.set("joinedDate", new SimpleDateFormat("yyyy-MM-dd").format(new Date()));
                    newRow.set("invitation_token", tokenPayload);
                    targetRow = usersTable.insertRow(newRow);
                }

                // Dispatch invitation email with welcome message & Set Password link via SMTP
                boolean emailSent = sendInvitationEmail(email, fullName, gymName, role, setPasswordUrl);

                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("message", "Invitation email sent successfully to " + email);
                res.put("emailDelivered", emailSent);

                JSONObject delivery = new JSONObject();
                delivery.put("delivered", emailSent);
                delivery.put("method", "SMTP");
                delivery.put("recipient", email);
                res.put("emailDelivery", delivery);

                JSONObject invObj = new JSONObject();
                invObj.put("email", email);
                invObj.put("role", role);
                invObj.put("token", token);
                invObj.put("setPasswordUrl", setPasswordUrl);
                invObj.put("expiresIn", "48 hours");
                res.put("invitation", invObj);

                JSONObject dataObj = new JSONObject();
                dataObj.put("user", rowToJson(targetRow));
                dataObj.put("invitation", invObj);
                dataObj.put("emailDelivery", delivery);
                res.put("data", dataObj);

                response.setStatus(201);
                out.print(res.toString());
                return;
            }

            if ("/auth/invitations".equals(path) && "GET".equalsIgnoreCase(method)) {
                ZCTable usersTable = zcObject.getTable("GymUsers");
                List<ZCRowObject> allUsers = usersTable.getAllRows();
                String callerGym = getCallerGymName(request, allUsers);
                JSONArray list = new JSONArray();
                for (ZCRowObject row : allUsers) {
                    JSONObject u = rowToJson(row);
                    if (callerGym != null && !callerGym.isEmpty()) {
                        String uGym = resolveGymName(u, allUsers);
                        if (!isSameGym(uGym, callerGym)) continue;
                    }
                    String st = u.optString("status", "");
                    String tok = u.optString("invitation_token", "");
                    if ("Pending".equalsIgnoreCase(st) || "SENT".equalsIgnoreCase(st) || tok.startsWith("INVITE:")) {
                        list.put(u);
                    }
                }
                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("data", list);
                out.print(res.toString());
                return;
            }

            if ("/auth/resend-invite".equals(path) && "POST".equalsIgnoreCase(method)) {
                JSONObject body = parseBody(request);
                String email = body.optString("email", "").trim().toLowerCase();
                if (email.isEmpty()) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Email is required.").toString());
                    return;
                }

                ZCTable usersTable = zcObject.getTable("GymUsers");
                List<ZCRowObject> allUsers = usersTable.getAllRows();
                ZCRowObject matchedRow = null;
                JSONObject matched = null;

                for (ZCRowObject row : allUsers) {
                    JSONObject u = rowToJson(row);
                    if (email.equalsIgnoreCase(u.optString("email"))) {
                        matchedRow = row;
                        matched = u;
                        break;
                    }
                }

                if (matchedRow == null || matched == null) {
                    response.setStatus(404);
                    out.print(new JSONObject().put("status", "error").put("message", "No user found with email " + email).toString());
                    return;
                }

                // Generate fresh token
                String token = UUID.randomUUID().toString().replace("-", "");
                long expiry = System.currentTimeMillis() + (48L * 60 * 60 * 1000); // 48 hours
                String tokenPayload = "INVITE:" + token + ":" + expiry;

                String baseUrl = "https://gym-management-system-60089931848.development.catalystserverless.in/app/index.html";
                String setPasswordUrl = baseUrl + "#/set-password?token=" + token + "&email=" + URLEncoder.encode(email, "UTF-8");

                matchedRow.set("invitation_token", tokenPayload);
                matchedRow.set("status", "Pending");
                ArrayList<ZCRowObject> ul = new ArrayList<>();
                ul.add(matchedRow);
                usersTable.updateRows(ul);

                String name = matched.optString("name", "Team Member");
                String role = matched.optString("role", "Member");
                String gym = matched.optString("emergencyContact", "Aurum Fitness Club");

                boolean sent = sendInvitationEmail(email, name, gym, role, setPasswordUrl);

                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("emailDelivered", sent);
                res.put("message", "Invitation email re-dispatched successfully to " + email);
                JSONObject invObj = new JSONObject();
                invObj.put("email", email);
                invObj.put("role", role);
                invObj.put("token", token);
                invObj.put("setPasswordUrl", setPasswordUrl);
                res.put("invitation", invObj);
                out.print(res.toString());
                return;
            }

            if ("/auth/cancel-invite".equals(path) && "POST".equalsIgnoreCase(method)) {
                JSONObject body = parseBody(request);
                String email = body.optString("email", "").trim().toLowerCase();
                if (!email.isEmpty()) {
                    ZCTable usersTable = zcObject.getTable("GymUsers");
                    List<ZCRowObject> allUsers = usersTable.getAllRows();
                    for (ZCRowObject row : allUsers) {
                        JSONObject u = rowToJson(row);
                        if (email.equalsIgnoreCase(u.optString("email"))) {
                            try {
                                usersTable.deleteRow(Long.parseLong(String.valueOf(u.opt("ROWID"))));
                            } catch (Exception ignored) {}
                            break;
                        }
                    }
                }
                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("message", "Invitation cancelled successfully.");
                out.print(res.toString());
                return;
            }

            if ("/auth/verify-invitation".equals(path) && "GET".equalsIgnoreCase(method)) {
                String token = request.getParameter("token");
                String email = request.getParameter("email");
                if (email != null) email = email.trim().toLowerCase();
                if (token != null) token = token.trim();

                if (email == null || email.isEmpty() || token == null || token.isEmpty()) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("valid", false).put("message", "Both token and email query parameters are required.").toString());
                    return;
                }

                ZCTable usersTable = zcObject.getTable("GymUsers");
                List<ZCRowObject> allUsers = usersTable.getAllRows();
                JSONObject matched = null;

                for (ZCRowObject row : allUsers) {
                    JSONObject u = rowToJson(row);
                    if (email.equalsIgnoreCase(u.optString("email"))) {
                        matched = u;
                        break;
                    }
                }

                if (matched == null) {
                    response.setStatus(404);
                    out.print(new JSONObject().put("status", "error").put("valid", false).put("message", "No invitation record found for " + email).toString());
                    return;
                }

                String tokenStored = matched.optString("invitation_token", "");
                if ("ACTIVATED".equalsIgnoreCase(tokenStored)) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("valid", false).put("message", "This invitation has already been used and password has been set. Please sign in.").toString());
                    return;
                }

                if (!tokenStored.startsWith("INVITE:")) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("valid", false).put("message", "Invalid invitation token format.").toString());
                    return;
                }

                String[] parts = tokenStored.split(":");
                if (parts.length < 3) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("valid", false).put("message", "Malformed invitation token.").toString());
                    return;
                }

                String expectedToken = parts[1];
                long expiry = 0;
                try {
                    expiry = Long.parseLong(parts[2]);
                } catch (Exception ignored) {}

                if (!expectedToken.equals(token)) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("valid", false).put("message", "Invitation token does not match.").toString());
                    return;
                }

                if (System.currentTimeMillis() > expiry) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("valid", false).put("message", "This invitation link has expired (valid for 48 hours). Please request a new invitation.").toString());
                    return;
                }

                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("valid", true);
                JSONObject data = new JSONObject();
                data.put("email", matched.optString("email"));
                data.put("name", matched.optString("name"));
                data.put("role", matched.optString("role", "Member"));
                data.put("gymName", matched.optString("emergencyContact", "Aurum Fitness Club"));
                res.put("data", data);
                out.print(res.toString());
                return;
            }

            if ("/auth/set-password".equals(path) && "POST".equalsIgnoreCase(method)) {
                JSONObject body = parseBody(request);
                String email = body.optString("email", "").trim().toLowerCase();
                String token = body.optString("token", "").trim();
                String password = body.optString("password", "").trim();

                if (email.isEmpty() || password.isEmpty()) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Email and password are required.").toString());
                    return;
                }

                if (password.length() < 8) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Password must be at least 8 characters long.").toString());
                    return;
                }

                ZCTable usersTable = zcObject.getTable("GymUsers");
                List<ZCRowObject> allUsers = usersTable.getAllRows();
                ZCRowObject matchedRow = null;
                JSONObject matched = null;

                for (ZCRowObject row : allUsers) {
                    JSONObject u = rowToJson(row);
                    if (email.equalsIgnoreCase(u.optString("email"))) {
                        matchedRow = row;
                        matched = u;
                        break;
                    }
                }

                if (matchedRow == null || matched == null) {
                    response.setStatus(404);
                    out.print(new JSONObject().put("status", "error").put("message", "User account not found for " + email).toString());
                    return;
                }

                String tokenStored = matched.optString("invitation_token", "");
                if ("ACTIVATED".equalsIgnoreCase(tokenStored)) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Password has already been configured for this account. Please sign in.").toString());
                    return;
                }

                if (token != null && !token.isEmpty() && tokenStored.startsWith("INVITE:")) {
                    String[] parts = tokenStored.split(":");
                    if (parts.length >= 3) {
                        String expectedToken = parts[1];
                        long expiry = Long.parseLong(parts[2]);
                        if (!expectedToken.equals(token)) {
                            response.setStatus(400);
                            out.print(new JSONObject().put("status", "error").put("message", "Invalid invitation token.").toString());
                            return;
                        }
                        if (System.currentTimeMillis() > expiry) {
                            response.setStatus(400);
                            out.print(new JSONObject().put("status", "error").put("message", "Invitation link has expired.").toString());
                            return;
                        }
                    }
                }

                String passwordHash = Base64.getEncoder().encodeToString(password.getBytes());

                matchedRow.set("status", "Active");
                matchedRow.set("invitation_token", "ACTIVATED");
                matchedRow.set("password_hash", passwordHash);

                ArrayList<ZCRowObject> ul = new ArrayList<>();
                ul.add(matchedRow);
                usersTable.updateRows(ul);

                matched.put("status", "Active");
                matched.put("user_status", "Active");
                matched.put("password_hash", passwordHash);

                // Create session cookie for automatic sign in
                JSONObject session = new JSONObject();
                session.put("rowid", matched.opt("ROWID"));
                session.put("email", matched.optString("email"));
                session.put("role", matched.optString("role", "Member"));
                String b64 = Base64.getEncoder().encodeToString(session.toString().getBytes());

                Cookie cookie = new Cookie("gym_session", b64);
                cookie.setPath("/");
                cookie.setMaxAge(2592000); // 30 days
                response.addCookie(cookie);

                // Auto-record member attendance upon initial activation login
                if ("Member".equalsIgnoreCase(matched.optString("role", "Member"))) {
                    try {
                        ZCTable attTable = zcObject.getTable("Attendance");
                        SimpleDateFormat istDateFmt = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);
                        istDateFmt.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));
                        SimpleDateFormat istTimeFmt = new SimpleDateFormat("hh:mm a", Locale.ENGLISH);
                        istTimeFmt.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));

                        ZCRowObject attRow = ZCRowObject.getInstance();
                        attRow.set("memberId", String.valueOf(matched.opt("ROWID")));
                        attRow.set("memberName", matched.optString("name", "Member"));
                        attRow.set("attendanceDate", istDateFmt.format(new Date()));
                        attRow.set("checkInTime", istTimeFmt.format(new Date()));
                        attRow.set("checkOutTime", "In Session");
                        attRow.set("status", "Present");
                        attTable.insertRow(attRow);
                        LOGGER.info("[ATTENDANCE] Recorded activation check-in for new member: " + matched.optString("email") + " at " + istTimeFmt.format(new Date()));
                    } catch (Exception attEx) {
                        LOGGER.warning("[ATTENDANCE] Auto-checkin on activation failed: " + attEx.getMessage());
                    }
                }

                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("authenticated", true);
                res.put("message", "Password configured successfully! Welcome to " + matched.optString("role", "Member") + " Dashboard.");
                JSONObject data = new JSONObject();
                data.put("user", matched);
                data.put("role", matched.optString("role", "Member"));
                res.put("data", data);
                out.print(res.toString());
                return;
            }

            // -------------------------------------------------------------
            // 1.5. GYM PROFILE & NAME MANAGEMENT
            // -------------------------------------------------------------
            if ("/gym/update".equals(path) && ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method))) {
                JSONObject body = parseBody(request);
                String newGymName = body.optString("gymName", body.optString("name", "")).trim();
                String headerEmail = request.getHeader("x-user-email");
                String headerId = request.getHeader("x-user-id");
                String queryEmail = request.getParameter("email");
                String bodyEmail = body.optString("email", "").trim();
                String bodyId = body.optString("userId", body.optString("ROWID", "")).trim();

                String cookieEmail = null;
                Cookie[] cookies = request.getCookies();
                if (cookies != null) {
                    for (Cookie c : cookies) {
                        if ("gym_session".equals(c.getName())) {
                            try {
                                String decoded = new String(Base64.getDecoder().decode(c.getValue()));
                                JSONObject sess = new JSONObject(decoded);
                                cookieEmail = sess.optString("email", null);
                            } catch (Exception ignored) {}
                        }
                    }
                }

                String targetEmail = !bodyEmail.isEmpty() ? bodyEmail : (headerEmail != null ? headerEmail : (cookieEmail != null ? cookieEmail : queryEmail));
                String targetId = !bodyId.isEmpty() ? bodyId : headerId;

                if (newGymName.isEmpty()) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "Gym name is required.").toString());
                    return;
                }

                ZCTable usersTable = zcObject.getTable("GymUsers");
                List<ZCRowObject> allUsers = usersTable.getAllRows();
                ZCRowObject ownerRow = null;

                // 1. Match by ID if available
                if (targetId != null && !targetId.isEmpty()) {
                    for (ZCRowObject row : allUsers) {
                        JSONObject u = rowToJson(row);
                        if (targetId.equals(String.valueOf(u.opt("ROWID")))) {
                            ownerRow = row;
                            break;
                        }
                    }
                }

                // 2. Match by email if available
                if (ownerRow == null && targetEmail != null && !targetEmail.isEmpty()) {
                    for (ZCRowObject row : allUsers) {
                        JSONObject u = rowToJson(row);
                        if (targetEmail.equalsIgnoreCase(u.optString("email"))) {
                            ownerRow = row;
                            break;
                        }
                    }
                }

                // 3. Fallback to owner record
                if (ownerRow == null) {
                    for (ZCRowObject row : allUsers) {
                        JSONObject u = rowToJson(row);
                        if ("Owner".equalsIgnoreCase(u.optString("role"))) {
                            ownerRow = row;
                            break;
                        }
                    }
                }

                if (ownerRow != null) {
                    ownerRow.set("emergencyContact", "Gym: " + newGymName);
                    try { ownerRow.set("gym_name", newGymName); } catch (Exception ignored) {}
                    try { ownerRow.set("gymName", newGymName); } catch (Exception ignored) {}
                    ArrayList<ZCRowObject> updateList = new ArrayList<>();
                    updateList.add(ownerRow);
                    usersTable.updateRows(updateList);
                    cachedFacilityGymName = formatGymTitle(newGymName);

                    JSONObject res = new JSONObject();
                    res.put("status", "success");
                    res.put("gymName", newGymName);
                    res.put("gym_name", newGymName);
                    res.put("message", "Gym name updated to \"" + newGymName + "\" successfully!");
                    out.print(res.toString());
                    return;
                } else {
                    response.setStatus(404);
                    out.print(new JSONObject().put("status", "error").put("message", "Owner account not found.").toString());
                    return;
                }
            }

            // -------------------------------------------------------------
            // 2. DASHBOARD STATS
            // -------------------------------------------------------------
            if ("/dashboard/stats".equals(path) && "GET".equalsIgnoreCase(method)) {
                List<ZCRowObject> users = zcObject.getTable("GymUsers").getAllRows();
                List<ZCRowObject> subs = zcObject.getTable("Subscriptions").getAllRows();
                List<ZCRowObject> pays = zcObject.getTable("Payments").getAllRows();
                List<ZCRowObject> atts = zcObject.getTable("Attendance").getAllRows();

                String callerGym = getCallerGymName(request, users);
                if (callerGym == null || callerGym.isEmpty()) callerGym = "Sabari Fitness";

                Set<String> gymMemberIds = new HashSet<>();
                Set<String> gymMemberEmails = new HashSet<>();

                int totalMembers = 0;
                int activeMembers = 0;
                int activeTrainers = 0;
                double totalRevenue = 0.0;

                JSONArray recentRegistrations = new JSONArray();
                for (ZCRowObject u : users) {
                    JSONObject ju = rowToJson(u);
                    String uRole = ju.optString("role");
                    String uStatus = ju.optString("status");
                    String uGym = resolveGymName(ju, users);

                    if (!isSameGym(uGym, callerGym)) continue;

                    String uId = String.valueOf(ju.opt("ROWID"));
                    String uEmail = ju.optString("email").toLowerCase();

                    if ("Member".equalsIgnoreCase(uRole)) {
                        gymMemberIds.add(uId);
                        if (!uEmail.isEmpty()) gymMemberEmails.add(uEmail);
                        totalMembers++;
                        if ("Active".equalsIgnoreCase(uStatus)) activeMembers++;
                        if (recentRegistrations.length() < 5) recentRegistrations.put(ju);
                    } else if ("Trainer".equalsIgnoreCase(uRole) && "Active".equalsIgnoreCase(uStatus)) {
                        activeTrainers++;
                    }
                }

                JSONArray recentPayments = new JSONArray();
                for (ZCRowObject p : pays) {
                    JSONObject jp = rowToJson(p);
                    String pMemId = jp.optString("memberId", jp.optString("pay_member_id", ""));
                    String pEmail = jp.optString("memberEmail", "").toLowerCase();
                    boolean belongs = gymMemberIds.contains(pMemId) || (!pEmail.isEmpty() && gymMemberEmails.contains(pEmail));
                    if (!belongs && !gymMemberIds.isEmpty()) continue;

                    if ("Completed".equalsIgnoreCase(jp.optString("status"))) {
                        try {
                            totalRevenue += Double.parseDouble(jp.optString("amount", "0"));
                        } catch (Exception ignored) {}
                    }
                    if (recentPayments.length() < 5) recentPayments.put(jp);
                }

                SimpleDateFormat istDateFmt = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);
                istDateFmt.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));
                String todayStr = istDateFmt.format(new Date());
                int todayAttCount = 0;
                JSONArray recentAttendance = new JSONArray();
                for (ZCRowObject a : atts) {
                    JSONObject ja = rowToJson(a);
                    String aMemId = ja.optString("memberId", ja.optString("att_member_id", ""));
                    String aEmail = ja.optString("memberEmail", "").toLowerCase();
                    boolean belongs = gymMemberIds.contains(aMemId) || (!aEmail.isEmpty() && gymMemberEmails.contains(aEmail));
                    if (!belongs && !gymMemberIds.isEmpty()) continue;

                    if (todayStr.equals(ja.optString("attendanceDate"))) {
                        todayAttCount++;
                    }
                    if (recentAttendance.length() < 5) recentAttendance.put(ja);
                }

                long nowMs = System.currentTimeMillis();
                long thirtyDaysMs = 30L * 24 * 60 * 60 * 1000;
                int expiringCount = 0;
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                for (ZCRowObject s : subs) {
                    JSONObject js = rowToJson(s);
                    String sMemId = js.optString("memberId", js.optString("sub_member_id", ""));
                    String sEmail = js.optString("memberEmail", "").toLowerCase();
                    boolean belongs = gymMemberIds.contains(sMemId) || (!sEmail.isEmpty() && gymMemberEmails.contains(sEmail));
                    if (!belongs && !gymMemberIds.isEmpty()) continue;

                    String endStr = js.optString("endDate");
                    if (!endStr.isEmpty()) {
                        try {
                            Date endDate = sdf.parse(endStr);
                            long diff = endDate.getTime() - nowMs;
                            if (diff >= 0 && diff <= thirtyDaysMs) {
                                expiringCount++;
                            }
                        } catch (Exception ignored) {}
                    }
                }

                JSONObject stats = new JSONObject();
                stats.put("totalMembers", totalMembers);
                stats.put("activeMembers", activeMembers);
                stats.put("activeTrainers", activeTrainers);
                stats.put("totalRevenue", totalRevenue);
                stats.put("expiringSoonCount", expiringCount);
                stats.put("todayAttendanceCount", todayAttCount);
                stats.put("recentPayments", recentPayments);
                stats.put("recentAttendance", recentAttendance);
                stats.put("gymName", callerGym);
                stats.put("gym_name", callerGym);

                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("data", stats);
                out.print(res.toString());
                return;
            }

            // -------------------------------------------------------------
            // 3. MEMBERS MANAGEMENT
            // -------------------------------------------------------------
            if ("/members".equals(path)) {
                ZCTable table = zcObject.getTable("GymUsers");
                if ("GET".equalsIgnoreCase(method)) {
                    String trainerId = request.getParameter("trainer_id");
                    String search = request.getParameter("search");
                    List<ZCRowObject> all = table.getAllRows();
                    String callerGym = getCallerGymName(request, all);
                    JSONArray list = new JSONArray();

                    for (ZCRowObject row : all) {
        
                        JSONObject u = rowToJson(row);
                        if (!"Member".equalsIgnoreCase(u.optString("role"))) continue;
                        String uGym = resolveGymName(u, all);
                        u.put("gymName", uGym);
                        u.put("gym_name", uGym);

                        if (callerGym != null && !callerGym.isEmpty()) {
                            if (!isSameGym(uGym, callerGym)) continue;
                        }

                        if (trainerId != null && !trainerId.equals(String.valueOf(u.opt("assignedTrainer")))) continue;
                        if (search != null && !search.isEmpty()) {
                            String q = search.toLowerCase();
                            String full = (u.optString("name") + " " + u.optString("email")).toLowerCase();
                            if (!full.contains(q)) continue;
                        }
                        list.put(u);
                    }
                    out.print(new JSONObject().put("status", "success").put("data", list).toString());
                    return;
                } else if ("POST".equalsIgnoreCase(method)) {
                    JSONObject body = parseBody(request);
                    String firstName = body.optString("user_first_name", body.optString("firstName", ""));
                    String lastName = body.optString("user_last_name", body.optString("lastName", ""));
                    String fullName = body.optString("name", (firstName + " " + lastName).trim());

                    List<ZCRowObject> allUsers = table.getAllRows();
                    String callerGym = getCallerGymName(request, allUsers);
                    String assignedEmergency = body.optString("emergency_contact", body.optString("emergencyContact", ""));
                    if (assignedEmergency.isEmpty() || isGenericGymName(assignedEmergency)) {
                        assignedEmergency = "Gym: " + (callerGym != null && !callerGym.isEmpty() ? callerGym : "Sabari Fitness");
                    }

                    ZCRowObject row = ZCRowObject.getInstance();
                    row.set("name", fullName);
                    row.set("email", body.optString("user_email", body.optString("email", "")));
                    row.set("phone", body.optString("user_phone", body.optString("phone", "")));
                    row.set("role", "Member");
                    row.set("status", body.optString("user_status", body.optString("status", "Active")));
                    row.set("assignedTrainer", body.optString("assigned_trainer_id", body.optString("assignedTrainer", "None")));
                    row.set("emergencyContact", assignedEmergency);
                    row.set("joinedDate", new SimpleDateFormat("yyyy-MM-dd").format(new Date()));

                    ZCRowObject inserted = table.insertRow(row);
                    response.setStatus(201);
                    out.print(new JSONObject().put("status", "success").put("data", rowToJson(inserted)).toString());
                    return;
                }
            }

            if (path.startsWith("/members/") && "PUT".equalsIgnoreCase(method)) {
                String idStr = path.substring("/members/".length());
                JSONObject body = parseBody(request);
                ZCTable table = zcObject.getTable("GymUsers");
                ZCRowObject row = ZCRowObject.getInstance();
                row.set("ROWID", Long.parseLong(idStr));
                if (body.has("name")) row.set("name", body.optString("name"));
                if (body.has("email")) row.set("email", body.optString("email"));
                if (body.has("phone")) row.set("phone", body.optString("phone"));
                if (body.has("status")) row.set("status", body.optString("status"));
                if (body.has("assignedTrainer")) {
                    row.set("assignedTrainer", body.optString("assignedTrainer"));
                } else if (body.has("assigned_trainer_id")) {
                    row.set("assignedTrainer", body.optString("assigned_trainer_id"));
                }
                if (body.has("emergencyContact")) row.set("emergencyContact", body.optString("emergencyContact"));
                ArrayList<ZCRowObject> list = new ArrayList<>();
                list.add(row);
                table.updateRows(list);
                out.print(new JSONObject().put("status", "success").put("data", body).toString());
                return;
            }

            if (path.startsWith("/members/") && "DELETE".equalsIgnoreCase(method)) {
                String idStr = path.substring("/members/".length());
                zcObject.getTable("GymUsers").deleteRow(Long.parseLong(idStr));
                out.print(new JSONObject().put("status", "success").put("message", "Member deleted").toString());
                return;
            }

            // -------------------------------------------------------------
            // 4. TRAINERS MANAGEMENT
            // -------------------------------------------------------------
            if ("/trainers".equals(path)) {
                ZCTable table = zcObject.getTable("GymUsers");
                if ("GET".equalsIgnoreCase(method)) {
                    List<ZCRowObject> all = table.getAllRows();
                    String callerGym = getCallerGymName(request, all);

                    List<JSONObject> trainers = new ArrayList<>();
                    List<JSONObject> members = new ArrayList<>();

                    for (ZCRowObject row : all) {
                        JSONObject u = rowToJson(row);
                        String role = u.optString("role");
                        String uGym = resolveGymName(u, all);
                        u.put("gymName", uGym);
                        u.put("gym_name", uGym);

                        if (callerGym != null && !callerGym.isEmpty()) {
                            if (!isSameGym(uGym, callerGym)) continue;
                        }

                        if ("Trainer".equalsIgnoreCase(role)) trainers.add(u);
                        if ("Member".equalsIgnoreCase(role)) members.add(u);
                    }

                    JSONArray result = new JSONArray();
                    for (JSONObject t : trainers) {
                        String tName = t.optString("name");
                        String tId = String.valueOf(t.opt("ROWID"));
                        int count = 0;
                        for (JSONObject m : members) {
                            String mAssigned = m.optString("assignedTrainer", "");
                            if (tName.equalsIgnoreCase(mAssigned) || tId.equals(mAssigned)) count++;
                        }
                        t.put("assignedMembersCount", count);
                        result.put(t);
                    }
                    out.print(new JSONObject().put("status", "success").put("data", result).toString());
                    return;
                } else if ("POST".equalsIgnoreCase(method)) {
                    JSONObject body = parseBody(request);
                    String firstName = body.optString("user_first_name", body.optString("firstName", ""));
                    String lastName = body.optString("user_last_name", body.optString("lastName", ""));
                    String fullName = body.optString("name", (firstName + " " + lastName).trim());

                    List<ZCRowObject> allUsers = table.getAllRows();
                    String callerGym = getCallerGymName(request, allUsers);
                    String assignedEmergency = body.optString("emergency_contact", body.optString("emergencyContact", ""));
                    if (assignedEmergency.isEmpty() || isGenericGymName(assignedEmergency)) {
                        assignedEmergency = "Gym: " + (callerGym != null && !callerGym.isEmpty() ? callerGym : "Sabari Fitness");
                    }

                    ZCRowObject row = ZCRowObject.getInstance();
                    row.set("name", fullName);
                    row.set("email", body.optString("user_email", body.optString("email", "")));
                    row.set("phone", body.optString("user_phone", body.optString("phone", "")));
                    row.set("role", "Trainer");
                    row.set("status", body.optString("user_status", body.optString("status", "Active")));
                    row.set("assignedTrainer", "Self");
                    row.set("emergencyContact", assignedEmergency);
                    row.set("joinedDate", new SimpleDateFormat("yyyy-MM-dd").format(new Date()));

                    ZCRowObject inserted = table.insertRow(row);
                    response.setStatus(201);
                    out.print(new JSONObject().put("status", "success").put("data", rowToJson(inserted)).toString());
                    return;
                }
            }

            if (path.startsWith("/trainers/") && "PUT".equalsIgnoreCase(method)) {
                String idStr = path.substring("/trainers/".length());
                JSONObject body = parseBody(request);
                ZCTable table = zcObject.getTable("GymUsers");
                ZCRowObject row = ZCRowObject.getInstance();
                row.set("ROWID", Long.parseLong(idStr));
                if (body.has("name")) row.set("name", body.optString("name"));
                if (body.has("email")) row.set("email", body.optString("email"));
                if (body.has("phone")) row.set("phone", body.optString("phone"));
                if (body.has("status")) row.set("status", body.optString("status"));
                if (body.has("emergencyContact")) row.set("emergencyContact", body.optString("emergencyContact"));
                ArrayList<ZCRowObject> list = new ArrayList<>();
                list.add(row);
                table.updateRows(list);
                out.print(new JSONObject().put("status", "success").put("data", body).toString());
                return;
            }

            if (path.startsWith("/trainers/") && "DELETE".equalsIgnoreCase(method)) {
                String idStr = path.substring("/trainers/".length());
                zcObject.getTable("GymUsers").deleteRow(Long.parseLong(idStr));
                out.print(new JSONObject().put("status", "success").put("message", "Trainer deleted").toString());
                return;
            }

            // -------------------------------------------------------------
            // 5. MEMBERSHIP PLANS
            // -------------------------------------------------------------
            if ("/plans".equals(path)) {
                ZCTable table = zcObject.getTable("MembershipPlans");
                if ("GET".equalsIgnoreCase(method)) {
                    List<ZCRowObject> all = table.getAllRows();
                    JSONArray list = new JSONArray();
                    for (ZCRowObject row : all) list.put(rowToJson(row));
                    out.print(new JSONObject().put("status", "success").put("data", list).toString());
                    return;
                } else if ("POST".equalsIgnoreCase(method)) {
                    JSONObject body = parseBody(request);
                    ZCRowObject row = ZCRowObject.getInstance();
                    row.set("planName", body.optString("plan_name", body.optString("planName", "New Plan")));

                    double price = parseDoubleClean(body.optString("plan_price", body.optString("price", "49")), 49.0);
                    row.set("price", price);

                    int duration = 1;
                    try {
                        duration = body.optInt("durationMonths", 1);
                    } catch (Exception ignored) {}
                    row.set("durationMonths", duration);

                    row.set("description", body.optString("plan_description", body.optString("description", "Standard gym access")));
                    row.set("features", body.optString("features", "Gym floor, lockers, free WiFi"));
                    row.set("status", body.optString("plan_status", body.optString("status", "Active")));

                    ZCRowObject inserted = table.insertRow(row);
                    response.setStatus(201);
                    out.print(new JSONObject().put("status", "success").put("data", rowToJson(inserted)).toString());
                    return;
                }
            }

            if (path.startsWith("/plans/") && path.endsWith("/archive") && "POST".equalsIgnoreCase(method)) {
                String idStr = path.substring("/plans/".length(), path.length() - "/archive".length());
                ZCTable table = zcObject.getTable("MembershipPlans");
                ZCRowObject row = ZCRowObject.getInstance();
                row.set("ROWID", Long.parseLong(idStr));
                row.set("status", "Archived");
                ArrayList<ZCRowObject> list = new ArrayList<>();
                list.add(row);
                table.updateRows(list);
                out.print(new JSONObject().put("status", "success").put("message", "Plan archived").toString());
                return;
            }

            if (path.startsWith("/plans/") && "PUT".equalsIgnoreCase(method)) {
                String idStr = path.substring("/plans/".length());
                JSONObject body = parseBody(request);
                ZCTable table = zcObject.getTable("MembershipPlans");
                ZCRowObject row = ZCRowObject.getInstance();
                row.set("ROWID", Long.parseLong(idStr));
                if (body.has("planName")) row.set("planName", body.optString("planName"));
                if (body.has("price")) {
                    try { row.set("price", Double.parseDouble(body.optString("price", "49"))); } catch (Exception ignored) {}
                }
                if (body.has("durationMonths")) {
                    try { row.set("durationMonths", body.optInt("durationMonths", 1)); } catch (Exception ignored) {}
                }
                if (body.has("description")) row.set("description", body.optString("description"));
                if (body.has("status")) row.set("status", body.optString("status"));
                if (body.has("features")) row.set("features", body.optString("features"));
                ArrayList<ZCRowObject> list = new ArrayList<>();
                list.add(row);
                table.updateRows(list);
                out.print(new JSONObject().put("status", "success").put("data", body).toString());
                return;
            }

            if (path.startsWith("/plans/") && "DELETE".equalsIgnoreCase(method)) {
                String idStr = path.substring("/plans/".length());
                zcObject.getTable("MembershipPlans").deleteRow(Long.parseLong(idStr));
                out.print(new JSONObject().put("status", "success").put("message", "Plan deleted").toString());
                return;
            }

            // -------------------------------------------------------------
            // 6. SUBSCRIPTIONS
            // -------------------------------------------------------------
            if ("/subscriptions".equals(path)) {
                ZCTable table = zcObject.getTable("Subscriptions");
                if ("GET".equalsIgnoreCase(method)) {
                    String memberId = request.getParameter("member_id");
                    if (memberId == null || memberId.trim().isEmpty()) {
                        memberId = request.getParameter("sub_member_id");
                    }
                    String reqEmail = request.getParameter("email");
                    if (reqEmail == null || reqEmail.trim().isEmpty()) {
                        reqEmail = request.getHeader("x-user-email");
                    }
                    if (reqEmail != null) reqEmail = reqEmail.trim().toLowerCase();

                    // If memberId is still empty but we have user email, look up member's ROWID & name in GymUsers
                    String resolvedMemberName = "";
                    if ((memberId == null || memberId.trim().isEmpty()) && reqEmail != null && !reqEmail.isEmpty()) {
                        try {
                            List<ZCRowObject> allUsers = zcObject.getTable("GymUsers").getAllRows();
                            for (ZCRowObject uRow : allUsers) {
                                JSONObject uJson = rowToJson(uRow);
                                if (reqEmail.equalsIgnoreCase(uJson.optString("email"))) {
                                    memberId = String.valueOf(uJson.opt("ROWID"));
                                    resolvedMemberName = uJson.optString("name", "");
                                    break;
                                }
                            }
                        } catch (Exception ignored) {}
                    }

                    List<ZCRowObject> all = table.getAllRows();
                    List<ZCRowObject> allUsers = zcObject.getTable("GymUsers").getAllRows();
                    String callerGym = getCallerGymName(request, allUsers);

                    JSONArray list = new JSONArray();
                    for (ZCRowObject row : all) {
                        JSONObject s = rowToJson(row);
                        String recGym = resolveRecordGym(s, allUsers);
                        s.put("gymName", recGym);
                        s.put("gym_name", recGym);

                        if (callerGym != null && !callerGym.isEmpty()) {
                            if (!isSameGym(recGym, callerGym)) continue;
                        }

                        if (memberId != null && !memberId.trim().isEmpty()) {
                            String mId = s.optString("memberId", s.optString("sub_member_id", "")).trim();
                            String mName = s.optString("memberName", s.optString("member_name", "")).trim();
                            boolean matchId = memberId.trim().equals(mId);
                            boolean matchName = !resolvedMemberName.isEmpty() && resolvedMemberName.equalsIgnoreCase(mName);
                            if (!matchId && !matchName) continue;
                        }
                        list.put(s);
                    }
                    out.print(new JSONObject().put("status", "success").put("data", list).toString());
                    return;
                } else if ("POST".equalsIgnoreCase(method)) {
                    JSONObject body = parseBody(request);
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);
                    sdf.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));

                    String startStr = body.optString("startDate", body.optString("sub_start_date", ""));
                    Date startDate = startStr.isEmpty() ? new Date() : sdf.parse(startStr);
                    int days = 30;
                    try {
                        days = Integer.parseInt(body.optString("duration_days", body.optString("durationDays", "30")));
                    } catch (Exception ignored) {}
                    Date endDate = new Date(startDate.getTime() + (long) days * 24 * 60 * 60 * 1000);

                    double amount = parseDoubleClean(body.optString("sub_amount", body.optString("amount", "99")), 99.0);

                    String memberId = body.optString("sub_member_id", body.optString("memberId", "")).trim();
                    String memberName = body.optString("memberName", body.optString("member_name", "")).trim();

                    if (memberId.isEmpty()) {
                        String headerId = request.getHeader("x-user-id");
                        if (headerId != null && !headerId.trim().isEmpty()) memberId = headerId.trim();
                    }

                    if (memberId.isEmpty() || memberName.isEmpty() || "Member".equalsIgnoreCase(memberName)) {
                        String headerEmail = request.getHeader("x-user-email");
                        if (headerEmail == null) headerEmail = body.optString("memberEmail", "");
                        if (!headerEmail.trim().isEmpty()) {
                            try {
                                List<ZCRowObject> allUsers = zcObject.getTable("GymUsers").getAllRows();
                                for (ZCRowObject uRow : allUsers) {
                                    JSONObject uJson = rowToJson(uRow);
                                    if (headerEmail.trim().equalsIgnoreCase(uJson.optString("email"))) {
                                        if (memberId.isEmpty()) memberId = String.valueOf(uJson.opt("ROWID"));
                                        if (memberName.isEmpty() || "Member".equalsIgnoreCase(memberName)) {
                                            memberName = uJson.optString("name", (uJson.optString("user_first_name") + " " + uJson.optString("user_last_name")).trim());
                                        }
                                        break;
                                    }
                                }
                            } catch (Exception ignored) {}
                        }
                    }

                    if ((memberName.isEmpty() || "Member".equalsIgnoreCase(memberName)) && !memberId.isEmpty()) {
                        try {
                            ZCRowObject mRow = zcObject.getTable("GymUsers").getRow(Long.parseLong(memberId));
                            if (mRow != null) {
                                JSONObject mJson = rowToJson(mRow);
                                memberName = mJson.optString("name", (mJson.optString("user_first_name") + " " + mJson.optString("user_last_name")).trim());
                            }
                        } catch (Exception ignored) {}
                    }
                    if (memberName.isEmpty()) memberName = "Member";

                    ZCRowObject row = ZCRowObject.getInstance();
                    row.set("memberId", memberId);
                    row.set("memberName", memberName);
                    row.set("planId", body.optString("sub_plan_id", body.optString("planId", "")));
                    row.set("planName", body.optString("sub_plan_name", body.optString("planName", "Gold Plan")));
                    row.set("startDate", sdf.format(startDate));
                    row.set("endDate", sdf.format(endDate));
                    row.set("status", "Active");
                    row.set("amount", amount);

                    ZCRowObject inserted = table.insertRow(row);

                    // Automatic payment record
                    if (body.optBoolean("record_payment", true) && amount > 0) {
                        ZCRowObject payRow = ZCRowObject.getInstance();
                        payRow.set("memberId", memberId);
                        payRow.set("memberName", memberName);
                        payRow.set("amount", amount);
                        payRow.set("paymentDate", sdf.format(new Date()));
                        payRow.set("paymentMethod", body.optString("payment_method", "Credit Card"));
                        payRow.set("status", "Completed");
                        payRow.set("invoiceNumber", "INV-" + (System.currentTimeMillis() % 1000000));
                        zcObject.getTable("Payments").insertRow(payRow);
                    }

                    response.setStatus(201);
                    out.print(new JSONObject().put("status", "success").put("data", rowToJson(inserted)).toString());
                    return;
                }
            }

            if (path.startsWith("/subscriptions/") && "PUT".equalsIgnoreCase(method)) {
                String idStr = path.substring("/subscriptions/".length());
                JSONObject body = parseBody(request);
                ZCTable table = zcObject.getTable("Subscriptions");
                ZCRowObject row = ZCRowObject.getInstance();
                row.set("ROWID", Long.parseLong(idStr));
                if (body.has("status")) row.set("status", body.optString("status"));
                if (body.has("endDate")) row.set("endDate", body.optString("endDate"));
                if (body.has("planName")) row.set("planName", body.optString("planName"));
                ArrayList<ZCRowObject> list = new ArrayList<>();
                list.add(row);
                table.updateRows(list);
                out.print(new JSONObject().put("status", "success").put("data", body).toString());
                return;
            }

            // -------------------------------------------------------------
            // 7. PAYMENTS
            // -------------------------------------------------------------
            if ("/payments".equals(path)) {
                ZCTable table = zcObject.getTable("Payments");
                if ("GET".equalsIgnoreCase(method)) {
                    String memberId = request.getParameter("member_id");
                    List<ZCRowObject> all = table.getAllRows();
                    List<ZCRowObject> allUsers = zcObject.getTable("GymUsers").getAllRows();
                    String callerGym = getCallerGymName(request, allUsers);

                    JSONArray list = new JSONArray();
                    for (ZCRowObject row : all) {
                        JSONObject p = rowToJson(row);
                        String recGym = resolveRecordGym(p, allUsers);
                        p.put("gymName", recGym);
                        p.put("gym_name", recGym);

                        if (callerGym != null && !callerGym.isEmpty()) {
                            if (!isSameGym(recGym, callerGym)) continue;
                        }

                        if (memberId != null && !memberId.equals(String.valueOf(p.opt("memberId")))) continue;
                        list.put(p);
                    }
                    out.print(new JSONObject().put("status", "success").put("data", list).toString());
                    return;
                } else if ("POST".equalsIgnoreCase(method)) {
                    JSONObject body = parseBody(request);
                    double amount = parseDoubleClean(body.optString("pay_amount", body.optString("amount", "0")), 0.0);

                    ZCRowObject row = ZCRowObject.getInstance();
                    row.set("memberId", body.optString("pay_member_id", body.optString("memberId", "")));
                    row.set("memberName", body.optString("memberName", "Member"));
                    row.set("amount", amount);
                    row.set("paymentDate", body.optString("pay_date", body.optString("paymentDate", new SimpleDateFormat("yyyy-MM-dd").format(new Date()))));
                    row.set("paymentMethod", body.optString("pay_method", body.optString("paymentMethod", "Credit Card")));
                    row.set("status", "Completed");
                    row.set("invoiceNumber", body.optString("invoiceNumber", "INV-" + (System.currentTimeMillis() % 1000000)));

                    ZCRowObject inserted = table.insertRow(row);
                    response.setStatus(201);
                    out.print(new JSONObject().put("status", "success").put("data", rowToJson(inserted)).toString());
                    return;
                }
            }

            // -------------------------------------------------------------
            // 8. ATTENDANCE
            // -------------------------------------------------------------
            if ("/attendance".equals(path) && "GET".equalsIgnoreCase(method)) {
                String memberId = request.getParameter("member_id");
                if (memberId == null || memberId.trim().isEmpty()) {
                    memberId = request.getParameter("att_member_id");
                }
                List<ZCRowObject> all = zcObject.getTable("Attendance").getAllRows();
                List<ZCRowObject> allUsers = zcObject.getTable("GymUsers").getAllRows();
                String callerGym = getCallerGymName(request, allUsers);

                JSONArray list = new JSONArray();
                // Return newest attendance records first
                for (int i = all.size() - 1; i >= 0; i--) {
                    ZCRowObject row = all.get(i);
                    JSONObject a = rowToJson(row);
                    String recGym = resolveRecordGym(a, allUsers);
                    a.put("gymName", recGym);
                    a.put("gym_name", recGym);

                    if (callerGym != null && !callerGym.isEmpty()) {
                        if (!isSameGym(recGym, callerGym)) continue;
                    }

                    if (memberId != null && !memberId.trim().isEmpty()) {
                        String mId = a.optString("memberId", a.optString("att_member_id", "")).trim();
                        if (!memberId.trim().equals(mId)) continue;
                    }
                    list.put(a);
                }
                out.print(new JSONObject().put("status", "success").put("data", list).toString());
                return;
            }

            if ("/attendance/check-in".equals(path) && "POST".equalsIgnoreCase(method)) {
                JSONObject body = parseBody(request);
                String memberId = body.optString("att_member_id", body.optString("memberId", "")).trim();
                String memberName = body.optString("memberName", body.optString("name", "")).trim();
                
                //Time and Date format we are assign here
                SimpleDateFormat istTimeFmt = new SimpleDateFormat("hh:mm a", Locale.ENGLISH);
                istTimeFmt.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));
                SimpleDateFormat istDateFmt = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);
                istDateFmt.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));

                String todayStr = body.optString("attendanceDate", "").trim();
                if (todayStr.isEmpty()) todayStr = body.optString("att_date", "").trim();
                if (todayStr.isEmpty()) todayStr = istDateFmt.format(new Date());

                String timeStr = body.optString("checkIn Time", "").trim();
                if (timeStr.isEmpty()) timeStr = body.optString("time", "").trim();
                if (timeStr.isEmpty()) timeStr = istTimeFmt.format(new Date());

                if (memberName.isEmpty() && !memberId.isEmpty()) {
                    try {
                        ZCRowObject mRow = zcObject.getTable("GymUsers").getRow(Long.parseLong(memberId));
                        if (mRow != null) {
                            JSONObject mJson = rowToJson(mRow);
                            memberName = mJson.optString("name", (mJson.optString("user_first_name") + " " + mJson.optString("user_last_name")).trim());
                        }
                    } catch (Exception ignored) {}
                }
                if (memberName.isEmpty()) memberName = "Member";

                ZCTable table = zcObject.getTable("Attendance");
                List<ZCRowObject> all = table.getAllRows();
                for (ZCRowObject row : all) {
                    JSONObject a = rowToJson(row);
                    String mId = a.optString("memberId", a.optString("att_member_id", "")).trim();
                    String aDate = a.optString("attendanceDate", a.optString("att_date", "")).trim();
                    String aCheckOut = a.optString("checkOutTime", a.optString("att_check_out", "")).trim();
                    String aStatus = a.optString("status", a.optString("att_status", "")).trim();

                    if (memberId.equals(mId) && todayStr.equals(aDate) && ("In Session".equalsIgnoreCase(aCheckOut) || "Checked In".equalsIgnoreCase(aStatus))) {
                        response.setStatus(400);
                        out.print(new JSONObject().put("status", "error").put("message", "Member is already checked in today. Please check out first.").toString());
                        return;
                    }
                }

                ZCRowObject row = ZCRowObject.getInstance();
                row.set("memberId", memberId);
                row.set("memberName", memberName);
                row.set("attendanceDate", todayStr);
                row.set("checkInTime", timeStr);
                row.set("checkOutTime", "In Session");
                row.set("status", "Checked In");

                ZCRowObject inserted = table.insertRow(row);
                response.setStatus(201);
                out.print(new JSONObject().put("status", "success").put("data", rowToJson(inserted)).put("message", "Check-in recorded").toString());
                return;
            }

            if ("/attendance/check-out".equals(path) && "POST".equalsIgnoreCase(method)) {
                JSONObject body = parseBody(request);
                String rowIdStr = body.optString("ROWID", body.optString("rowid", "")).trim();
                String memberId = body.optString("att_member_id", body.optString("member_id", body.optString("memberId", ""))).trim();
                
                SimpleDateFormat istTimeFmt = new SimpleDateFormat("hh:mm a", Locale.ENGLISH);
                istTimeFmt.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));
                SimpleDateFormat istDateFmt = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);
                istDateFmt.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));

                String timeStr = body.optString("checkOutTime", "").trim();
                if (timeStr.isEmpty()) timeStr = body.optString("time", "").trim();
                if (timeStr.isEmpty()) timeStr = istTimeFmt.format(new Date());

                String todayStr = body.optString("attendanceDate", "").trim();
                if (todayStr.isEmpty()) todayStr = body.optString("att_date", "").trim();
                if (todayStr.isEmpty()) todayStr = istDateFmt.format(new Date());

                ZCTable table = zcObject.getTable("Attendance");
                ZCRowObject targetRow = null;

                if (!rowIdStr.isEmpty()) {
                    try {
                        long rid = Long.parseLong(rowIdStr);
                        targetRow = ZCRowObject.getInstance();
                        targetRow.set("ROWID", rid);
                    } catch (Exception ex) {
                        LOGGER.warning("Invalid ROWID for check-out: " + rowIdStr);
                    }
                }

                // If no valid ROWID provided, look up active session by memberId
                if (targetRow == null && !memberId.isEmpty()) {
                    List<ZCRowObject> all = table.getAllRows();
                    for (int i = all.size() - 1; i >= 0; i--) {
                        ZCRowObject r = all.get(i);
                        JSONObject a = rowToJson(r);
                        String mId = a.optString("memberId", a.optString("att_member_id", "")).trim();
                        String aDate = a.optString("attendanceDate", a.optString("att_date", "")).trim();
                        String aCheckOut = a.optString("checkOutTime", a.optString("att_check_out", "")).trim();
                        String aStatus = a.optString("status", a.optString("att_status", "")).trim();

                        if (memberId.equals(mId) && (todayStr.equals(aDate) || "In Session".equalsIgnoreCase(aCheckOut))) {
                            if ("In Session".equalsIgnoreCase(aCheckOut) || "Checked In".equalsIgnoreCase(aStatus) || "Present".equalsIgnoreCase(aStatus)) {
                                targetRow = r;
                                break;
                            }
                        }
                    }
                }

                if (targetRow == null) {
                    response.setStatus(400);
                    out.print(new JSONObject().put("status", "error").put("message", "No active attendance session found to check out.").toString());
                    return;
                }

                targetRow.set("checkOutTime", timeStr);
                targetRow.set("status", "Checked Out");

                ArrayList<ZCRowObject> list = new ArrayList<>();
                list.add(targetRow);
                table.updateRows(list);

                JSONObject res = new JSONObject();
                res.put("status", "success");
                res.put("message", "Check-out recorded successfully at " + timeStr);
                res.put("checkOutTime", timeStr);
                res.put("data", rowToJson(targetRow));
                out.print(res.toString());
                return;
            }

            // -------------------------------------------------------------
            // 9. WORKOUT PLANS
            // -------------------------------------------------------------
            if ("/workouts".equals(path)) {
                ZCTable table = zcObject.getTable("WorkoutPlans");
                if ("GET".equalsIgnoreCase(method)) {
                    String memberId = request.getParameter("member_id");
                    String trainerId = request.getParameter("trainer_id");
                    List<ZCRowObject> all = table.getAllRows();
                    List<ZCRowObject> allUsers = zcObject.getTable("GymUsers").getAllRows();
                    String callerGym = getCallerGymName(request, allUsers);

                    JSONArray list = new JSONArray();
                    for (ZCRowObject row : all) {
                        JSONObject w = rowToJson(row);
                        String recGym = resolveRecordGym(w, allUsers);
                        w.put("gymName", recGym);
                        w.put("gym_name", recGym);

                        if (callerGym != null && !callerGym.isEmpty()) {
                            if (!isSameGym(recGym, callerGym)) continue;
                        }

                        if (memberId != null && !memberId.trim().isEmpty()) {
                            String mId = w.optString("memberId", w.optString("workout_member_id", "")).trim();
                            if (!memberId.trim().equals(mId)) continue;
                        }
                        if (trainerId != null && !trainerId.trim().isEmpty()) {
                            String tId = w.optString("trainerId", w.optString("workout_trainer_id", "")).trim();
                            if (!trainerId.trim().equals(tId)) continue;
                        }
                        list.put(w);
                    }
                    out.print(new JSONObject().put("status", "success").put("data", list).toString());
                    return;
                } else if ("POST".equalsIgnoreCase(method)) {
                    JSONObject body = parseBody(request);
                    String memberId = body.optString("workout_member_id", body.optString("memberId", "")).trim();
                    String memberName = body.optString("workout_member_name", body.optString("memberName", "")).trim();
                    String trainerId = body.optString("workout_trainer_id", body.optString("trainerId", "")).trim();
                    String trainerName = body.optString("workout_trainer_name", body.optString("trainerName", "")).trim();

                    // Resolve memberName and trainerName if missing or default
                    if ((memberName.isEmpty() || "Member".equalsIgnoreCase(memberName)) || (trainerName.isEmpty() || "Trainer".equalsIgnoreCase(trainerName))) {
                        try {
                            ZCTable usersTable = zcObject.getTable("GymUsers");
                            List<ZCRowObject> allUsers = usersTable.getAllRows();
                            for (ZCRowObject uRow : allUsers) {
                                JSONObject uJson = rowToJson(uRow);
                                String uRowId = String.valueOf(uJson.opt("ROWID")).trim();
                                if ((memberName.isEmpty() || "Member".equalsIgnoreCase(memberName)) && !memberId.isEmpty() && memberId.equals(uRowId)) {
                                    String resolved = uJson.optString("name", "").trim();
                                    if (resolved.isEmpty()) {
                                        resolved = (uJson.optString("user_first_name", "") + " " + uJson.optString("user_last_name", "")).trim();
                                    }
                                    if (!resolved.isEmpty()) memberName = resolved;
                                }
                                if ((trainerName.isEmpty() || "Trainer".equalsIgnoreCase(trainerName)) && !trainerId.isEmpty() && trainerId.equals(uRowId)) {
                                    String resolved = uJson.optString("name", "").trim();
                                    if (resolved.isEmpty()) {
                                        resolved = (uJson.optString("user_first_name", "") + " " + uJson.optString("user_last_name", "")).trim();
                                    }
                                    if (!resolved.isEmpty()) trainerName = resolved;
                                }
                            }
                        } catch (Exception ex) {
                            LOGGER.warning("[WORKOUT CREATE] Could not resolve names from GymUsers: " + ex.getMessage());
                        }
                    }

                    ZCRowObject row = ZCRowObject.getInstance();
                    row.set("memberId", memberId);
                    row.set("memberName", memberName.isEmpty() ? "Member" : memberName);
                    row.set("trainerId", trainerId);
                    row.set("trainerName", trainerName.isEmpty() ? "Trainer" : trainerName);
                    row.set("title", body.optString("workout_title", body.optString("title", "Custom Workout Plan")));
                    row.set("goal", body.optString("workout_description", body.optString("goal", "Strength & Conditioning")));
                    row.set("difficulty", body.optString("difficulty", "Intermediate"));
                    row.set("schedule", body.optString("workout_schedule", body.optString("schedule", "")));
                    row.set("assignedDate", new SimpleDateFormat("yyyy-MM-dd").format(new Date()));
                     
                    ZCRowObject inserted = table.insertRow(row);
                    response.setStatus(201);
                    out.print(new JSONObject().put("status", "success").put("data", rowToJson(inserted)).toString());
                    return;
                }
            }

            if (path.startsWith("/workouts/") && "PUT".equalsIgnoreCase(method)) {
                String idStr = path.substring("/workouts/".length());
                JSONObject body = parseBody(request);
                ZCTable table = zcObject.getTable("WorkoutPlans");
                ZCRowObject row = ZCRowObject.getInstance();
                row.set("ROWID", Long.parseLong(idStr));
                if (body.has("title")) row.set("title", body.optString("title"));
                if (body.has("goal")) row.set("goal", body.optString("goal"));
                if (body.has("difficulty")) row.set("difficulty", body.optString("difficulty"));
                if (body.has("schedule")) row.set("schedule", body.optString("schedule"));
                ArrayList<ZCRowObject> list = new ArrayList<>();
                list.add(row);
                table.updateRows(list);
                out.print(new JSONObject().put("status", "success").put("data", body).toString());
                return;
            }

            if (path.startsWith("/workouts/") && "DELETE".equalsIgnoreCase(method)) {
                String idStr = path.substring("/workouts/".length());
                zcObject.getTable("WorkoutPlans").deleteRow(Long.parseLong(idStr));
                out.print(new JSONObject().put("status", "success").put("message", "Workout plan deleted").toString());
                return;
            }

            // -------------------------------------------------------------
            // 10. MEMBER PROGRESS
            // -------------------------------------------------------------
            if ("/progress".equals(path)) {
                ZCTable table = zcObject.getTable("MemberProgress");
                if ("GET".equalsIgnoreCase(method)) {
                    String memberId = request.getParameter("member_id");
                    if (memberId == null || memberId.trim().isEmpty()) {
                        memberId = request.getParameter("prog_member_id");
                    }
                    List<ZCRowObject> all = table.getAllRows();
                    List<ZCRowObject> allUsers = zcObject.getTable("GymUsers").getAllRows();
                    String callerGym = getCallerGymName(request, allUsers);

                    JSONArray list = new JSONArray();
                    for (ZCRowObject row : all) {
                        JSONObject p = rowToJson(row);
                        String recGym = resolveRecordGym(p, allUsers);
                        p.put("gymName", recGym);
                        p.put("gym_name", recGym);

                        if (callerGym != null && !callerGym.isEmpty()) {
                            if (!isSameGym(recGym, callerGym)) continue;
                        }

                        if (memberId != null && !memberId.trim().isEmpty()) {
                            String mId = p.optString("memberId", p.optString("prog_member_id", "")).trim();
                            if (!memberId.trim().equals(mId)) continue;
                        }
                        list.put(p);
                    }
                    out.print(new JSONObject().put("status", "success").put("data", list).toString());
                    return;
                } else if ("POST".equalsIgnoreCase(method)) {
                    JSONObject body = parseBody(request);
                    SimpleDateFormat istDateFmt = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);
                    istDateFmt.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));

                    double weight = parseDoubleClean(body.optString("weightKg", body.optString("prog_weight", "70.0")), 70.0);
                    double bodyFat = parseDoubleClean(body.optString("bodyFatPercentage", body.optString("prog_body_fat", "18.0")), 18.0);
                    double chest = parseDoubleClean(body.optString("chestCm", body.optString("prog_muscle_mass", "100.0")), 100.0);
                    double waist = parseDoubleClean(body.optString("waistCm", body.optString("prog_waist", "80.0")), 80.0);
                    double arms = parseDoubleClean(body.optString("armsCm", body.optString("prog_arms", "35.0")), 35.0);

                    String memberId = body.optString("prog_member_id", body.optString("memberId", "")).trim();
                    String memberName = body.optString("memberName", body.optString("prog_member_name", "")).trim();

                    if (memberId.isEmpty()) {
                        String hId = request.getHeader("x-user-id");
                        if (hId != null && !hId.trim().isEmpty()) memberId = hId.trim();
                    }
                    String userEmail = request.getHeader("x-user-email");
                    if (userEmail == null || userEmail.trim().isEmpty()) {
                        userEmail = body.optString("memberEmail", body.optString("email", "")).trim();
                    }

                    if ((memberName.isEmpty() || "Member".equalsIgnoreCase(memberName) || memberId.isEmpty()) && (!memberId.isEmpty() || !userEmail.isEmpty())) {
                        try {
                            ZCTable usersTable = zcObject.getTable("GymUsers");
                            List<ZCRowObject> allUsers = usersTable.getAllRows();
                            for (ZCRowObject uRow : allUsers) {
                                JSONObject uJson = rowToJson(uRow);
                                String uRowId = String.valueOf(uJson.opt("ROWID")).trim();
                                String uEmail = uJson.optString("email", "").trim();
                                boolean matchId = !memberId.isEmpty() && memberId.equals(uRowId);
                                boolean matchEmail = !userEmail.isEmpty() && userEmail.equalsIgnoreCase(uEmail);
                                if (matchId || matchEmail) {
                                    if (memberId.isEmpty()) memberId = uRowId;
                                    String resolved = uJson.optString("name", "").trim();
                                    if (resolved.isEmpty()) {
                                        resolved = (uJson.optString("user_first_name", "") + " " + uJson.optString("user_last_name", "")).trim();
                                    }
                                    if (!resolved.isEmpty()) memberName = resolved;
                                    break;
                                }
                            }
                        } catch (Exception ex) {
                            LOGGER.warning("[PROGRESS CREATE] Could not resolve member name: " + ex.getMessage());
                        }
                    }

                    ZCRowObject row = ZCRowObject.getInstance();
                    row.set("memberId", memberId);
                    row.set("memberName", memberName.isEmpty() ? "Member" : memberName);
                    row.set("recordedDate", body.optString("recordedDate", body.optString("prog_record_date", istDateFmt.format(new Date()))));
                    row.set("weightKg", weight);
                    row.set("bodyFatPercentage", bodyFat);
                    row.set("chestCm", chest);
                    row.set("waistCm", waist);
                    row.set("armsCm", arms);
                    row.set("notes", body.optString("prog_notes", body.optString("notes", "")));

                    ZCRowObject inserted = table.insertRow(row);
                    response.setStatus(201);
                    out.print(new JSONObject().put("status", "success").put("data", rowToJson(inserted)).toString());
                    return;
                }
            }

            if ((path.startsWith("/progress/") || "/progress".equals(path)) && "DELETE".equalsIgnoreCase(method)) {
                String idStr = "";
                if (path.startsWith("/progress/")) {
                    idStr = path.substring("/progress/".length()).trim();
                    if (idStr.contains("?")) idStr = idStr.substring(0, idStr.indexOf("?")).trim();
                    if (idStr.contains("/")) idStr = idStr.substring(0, idStr.indexOf("/")).trim();
                }
                if (idStr.isEmpty()) {
                    JSONObject body = parseBody(request);
                    idStr = body.optString("ROWID", body.optString("rowid", body.optString("id", ""))).trim();
                }

                if (!idStr.isEmpty()) {
                    try {
                        long rowId = Long.parseLong(idStr);
                        zcObject.getTable("MemberProgress").deleteRow(rowId);
                        LOGGER.info("[PROGRESS DELETE] Deleted row: " + rowId);
                        out.print(new JSONObject().put("status", "success").put("message", "Progress log deleted successfully").toString());
                        return;
                    } catch (Exception ex) {
                        LOGGER.warning("[PROGRESS DELETE] Failed: " + ex.getMessage());
                        response.setStatus(500);
                        out.print(new JSONObject().put("status", "error").put("message", "Failed to delete progress log: " + ex.getMessage()).toString());
                        return;
                    }
                }
            }

            // Fallback 404
            response.setStatus(404);
            out.print(new JSONObject().put("status", "error").put("message", "Route not found: " + path).toString());

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Handler exception: " + e.getMessage(), e);
            response.setStatus(500);
            out.print(new JSONObject().put("status", "error").put("message", e.getMessage()).toString());
        }
    }

    //Get the urlpath from the users
    private String cleanPath(String rawUri) {
        if (rawUri == null) return "/";
        String path = rawUri.replaceFirst("^/server/java_api(/execute)?", "");
        path = path.replaceFirst("^/execute", "");
        path = path.replaceFirst("^/server/api(/execute)?", "");
        path = path.replaceFirst("^/java_api", "");
        path = path.replaceFirst("^/api", "");
        if (path.isEmpty() || path.equals("")) return "/";
        int qIdx = path.indexOf('?');
        if (qIdx != -1) path = path.substring(0, qIdx);
        return path;
    }
 
    //Get the user info return it to the JSONObject
    private JSONObject parseBody(HttpServletRequest request) {
        try {
            StringBuilder sb = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            String str = sb.toString().trim();
            if (str.isEmpty()) return new JSONObject();
            return new JSONObject(str);
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    //Convert the RowData into JSON Object
    private JSONObject rowToJson(ZCRowObject row) {
        try {
            //if the row is null return the empty object
            if (row == null) return new JSONObject();
            //Convert the RowObject to JSON Object
            org.json.simple.JSONObject simpleObj = row.getRowObject();
            //if the simpleObj is not null convert it to JSONObject otherwise return the empty object
            JSONObject obj = (simpleObj != null) ? new JSONObject(simpleObj.toString()) : new JSONObject();
            if (row.get("ROWID") != null) {
                obj.put("ROWID", String.valueOf(row.get("ROWID")));
            }
            
            // 1. Normalize GymUsers
            if (obj.has("name") && !obj.has("user_first_name")) {
                String fullName = obj.optString("name", "");
                String[] parts = fullName.split(" ", 2);
                obj.put("user_first_name", parts[0]);
                obj.put("user_last_name", parts.length > 1 ? parts[1] : "");
            }
            if (obj.has("email") && !obj.has("user_email")) obj.put("user_email", obj.optString("email"));
            if (obj.has("role") && !obj.has("user_role")) obj.put("user_role", obj.optString("role"));
            if (obj.has("phone") && !obj.has("user_phone")) obj.put("user_phone", obj.optString("phone"));
            if (obj.has("assignedTrainer")) {
                String at = obj.optString("assignedTrainer");
                obj.put("assignedTrainer", at);
                obj.put("assigned_trainer", at);
                obj.put("assigned_trainer_id", at);
            } else if (obj.has("assigned_trainer_id")) {
                String at = obj.optString("assigned_trainer_id");
                obj.put("assignedTrainer", at);
                obj.put("assigned_trainer", at);
            }
            if (obj.has("emergencyContact") && !obj.has("emergency_contact")) obj.put("emergency_contact", obj.optString("emergencyContact"));

            // Vice-versa for backward-compatibility
            if (obj.has("user_first_name") && !obj.has("name")) {
                obj.put("name", (obj.optString("user_first_name") + " " + obj.optString("user_last_name", "")).trim());
            }
            if (obj.has("user_email") && !obj.has("email")) obj.put("email", obj.optString("user_email"));
            if (obj.has("user_role") && !obj.has("role")) obj.put("role", obj.optString("user_role"));
            if (obj.has("user_status") && !obj.has("status")) obj.put("status", obj.optString("user_status"));
            if (obj.has("user_phone") && !obj.has("phone")) obj.put("phone", obj.optString("user_phone"));
            String gymNameVal = resolveGymName(obj, null);
            obj.put("gym_name", gymNameVal);
            obj.put("gymName", gymNameVal);

            // 2. Normalize MembershipPlans
            if (obj.has("planName") && !obj.has("plan_name")) obj.put("plan_name", obj.optString("planName"));
            if (obj.has("price") && !obj.has("plan_price")) obj.put("plan_price", String.valueOf(obj.opt("price")));
            if (obj.has("durationMonths") && !obj.has("plan_duration_days")) {
                obj.put("plan_duration_days", String.valueOf(obj.optInt("durationMonths", 1) * 30));
            }
            if (obj.has("description") && !obj.has("plan_description")) obj.put("plan_description", obj.optString("description"));
            if (obj.has("status") && !obj.has("plan_status")) obj.put("plan_status", obj.optString("status"));

            // 3. Normalize Subscriptions
            if (obj.has("memberId") && !obj.has("sub_member_id")) obj.put("sub_member_id", obj.optString("memberId"));
            if (obj.has("planName") && !obj.has("sub_plan_name")) obj.put("sub_plan_name", obj.optString("planName"));
            if (obj.has("planId") && !obj.has("sub_plan_id")) obj.put("sub_plan_id", obj.optString("planId"));
            if (obj.has("startDate") && !obj.has("sub_start_date")) obj.put("sub_start_date", obj.optString("startDate"));
            if (obj.has("endDate") && !obj.has("sub_end_date")) obj.put("sub_end_date", obj.optString("endDate"));
            if (obj.has("status") && !obj.has("sub_status")) {
                obj.put("sub_status", obj.optString("status"));
                obj.put("sub_payment_status", "Paid");
            }
            if (obj.has("amount") && !obj.has("sub_amount")) obj.put("sub_amount", String.valueOf(obj.opt("amount")));

            // 4. Normalize Payments
            if (obj.has("memberId") && !obj.has("pay_member_id")) obj.put("pay_member_id", obj.optString("memberId"));
            if (obj.has("amount") && !obj.has("pay_amount")) obj.put("pay_amount", String.valueOf(obj.opt("amount")));
            if (obj.has("paymentDate") && !obj.has("pay_date")) obj.put("pay_date", obj.optString("paymentDate"));
            if (obj.has("paymentMethod") && !obj.has("pay_method")) obj.put("pay_method", obj.optString("paymentMethod"));
            if (obj.has("status") && !obj.has("pay_status")) obj.put("pay_status", obj.optString("status"));

            // 5. Normalize Attendance
            if (obj.has("memberId")) {
                obj.put("att_member_id", obj.optString("memberId"));
            } else if (obj.has("att_member_id")) {
                obj.put("memberId", obj.optString("att_member_id"));
            }
            if (obj.has("attendanceDate")) {
                obj.put("att_date", obj.optString("attendanceDate"));
            } else if (obj.has("att_date")) {
                obj.put("attendanceDate", obj.optString("att_date"));
            }
            if (obj.has("checkInTime") && !obj.has("att_check_in")) obj.put("att_check_in", obj.optString("checkInTime"));
            if (obj.has("checkOutTime") && !obj.has("att_check_out")) obj.put("att_check_out", obj.optString("checkOutTime"));
            if (obj.has("status") && !obj.has("att_status")) obj.put("att_status", obj.optString("status"));

            // 6. Normalize WorkoutPlans
            if (obj.has("memberId") && !obj.has("workout_member_id")) obj.put("workout_member_id", obj.optString("memberId"));
            if (obj.has("workout_member_id") && !obj.has("memberId")) obj.put("memberId", obj.optString("workout_member_id"));
            if (obj.has("memberName") && !obj.has("workout_member_name")) obj.put("workout_member_name", obj.optString("memberName"));
            if (obj.has("workout_member_name") && !obj.has("memberName")) obj.put("memberName", obj.optString("workout_member_name"));
            if (obj.has("trainerId") && !obj.has("workout_trainer_id")) obj.put("workout_trainer_id", obj.optString("trainerId"));
            if (obj.has("workout_trainer_id") && !obj.has("trainerId")) obj.put("trainerId", obj.optString("workout_trainer_id"));
            if (obj.has("trainerName") && !obj.has("workout_trainer_name")) obj.put("workout_trainer_name", obj.optString("trainerName"));
            if (obj.has("workout_trainer_name") && !obj.has("trainerName")) obj.put("trainerName", obj.optString("workout_trainer_name"));
            if (obj.has("title") && !obj.has("workout_title")) obj.put("workout_title", obj.optString("title"));
            if (obj.has("schedule") && !obj.has("workout_schedule")) obj.put("workout_schedule", obj.optString("schedule"));
            if (obj.has("goal") && !obj.has("workout_description")) obj.put("workout_description", obj.optString("goal"));
            if (!obj.has("workout_status")) obj.put("workout_status", "Active");

            // 7. Normalize MemberProgress
            if (obj.has("memberId") && !obj.has("prog_member_id")) obj.put("prog_member_id", obj.optString("memberId"));
            if (obj.has("prog_member_id") && !obj.has("memberId")) obj.put("memberId", obj.optString("prog_member_id"));
            if (obj.has("memberName") && !obj.has("prog_member_name")) obj.put("prog_member_name", obj.optString("memberName"));
            if (obj.has("prog_member_name") && !obj.has("memberName")) obj.put("memberName", obj.optString("prog_member_name"));
            if (obj.has("recordedDate") && !obj.has("prog_record_date")) obj.put("prog_record_date", obj.optString("recordedDate"));
            if (obj.has("prog_record_date") && !obj.has("recordedDate")) obj.put("recordedDate", obj.optString("prog_record_date"));
            if (obj.has("weightKg") && !obj.has("prog_weight")) obj.put("prog_weight", obj.opt("weightKg") + "kg");
            if (obj.has("bodyFatPercentage") && !obj.has("prog_body_fat")) obj.put("prog_body_fat", obj.opt("bodyFatPercentage") + "%");
            if (obj.has("chestCm") && !obj.has("prog_muscle_mass")) obj.put("prog_muscle_mass", obj.opt("chestCm") + "cm");
            if (obj.has("notes") && !obj.has("prog_notes")) obj.put("prog_notes", obj.optString("notes"));
            if (obj.has("prog_notes") && !obj.has("notes")) obj.put("notes", obj.optString("prog_notes"));

            return obj;
        } catch (Exception e) {
            return new JSONObject();
        }
    }
    //This method is used to parse the double value from the string
    private static double parseDoubleClean(String val, double defaultVal) {
        if (val == null) return defaultVal;
        String cleaned = val.replaceAll("[^0-9.]", "").trim();
        if (cleaned.isEmpty()) return defaultVal;
        try {
            return Double.parseDouble(cleaned);
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private static volatile String cachedFacilityGymName = null;
    
    //This function is used to check if the gym name is generic or not
    private static boolean isGenericGymName(String name) {
        if (name == null) return true;
        String t = name.trim();
        return t.isEmpty() ||
               "Aurum Fitness Club".equalsIgnoreCase(t) ||
               "Fitness Club".equalsIgnoreCase(t) ||
               "Fitness Center".equalsIgnoreCase(t) ||
               "Aurum Gym".equalsIgnoreCase(t) ||
               "None".equalsIgnoreCase(t) ||
               "None Listed".equalsIgnoreCase(t) ||
               "null".equalsIgnoreCase(t);
    }

    //This function is used to check if the two gym names are same or not
    private static boolean isSameGym(String gymA, String gymB) {
        if (gymA == null || gymB == null) return false;
        String a = gymA.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        String b = gymB.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        return !a.isEmpty() && a.equals(b);
    }


    //This function is used to format the gym name
    private static String formatGymTitle(String raw) {
        if (raw == null || raw.trim().isEmpty()) return "Fitness Center";
        String cleaned = raw.trim();
        if (cleaned.toLowerCase().startsWith("gym:") || cleaned.toLowerCase().startsWith("gym :")) {
            cleaned = cleaned.substring(cleaned.indexOf(':') + 1).trim();
        }
        if (cleaned.matches("^[A-Z][a-z]+[A-Z][a-z]+.*$")) {
            cleaned = cleaned.replaceAll("([a-z])([A-Z])", "$1 $2");
        }
        return cleaned;
    }
 
    //This function is used to get the caller user from the request
    //headers and cookies and URL parameters and all the details about the user 
    private JSONObject getCallerUser(HttpServletRequest request, List<ZCRowObject> allUsers) {
        String headerEmail = request.getHeader("x-user-email");
        String headerId = request.getHeader("x-user-id");
        String queryEmail = request.getParameter("caller_email"); 
        if (queryEmail == null || queryEmail.isEmpty()) queryEmail = request.getParameter("email");
        String cookieEmail = null;

        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("gym_session".equals(c.getName())) {
                    try {
                        String decoded = new String(Base64.getDecoder().decode(c.getValue()));
                        JSONObject sess = new JSONObject(decoded);
                        cookieEmail = sess.optString("email", null);
                    } catch (Exception ignored) {}
                }
            }
        }

        String targetEmail = headerEmail != null && !headerEmail.isEmpty() ? headerEmail : (cookieEmail != null && !cookieEmail.isEmpty() ? cookieEmail : queryEmail);
        if (targetEmail != null) targetEmail = targetEmail.trim().toLowerCase();

        if (allUsers != null) {
            for (ZCRowObject row : allUsers) {
                JSONObject u = rowToJson(row);
                if (headerId != null && !headerId.isEmpty() && headerId.equals(String.valueOf(u.opt("ROWID")))) {
                    return u;
                }
                if (targetEmail != null && !targetEmail.isEmpty() && targetEmail.equalsIgnoreCase(u.optString("email"))) {
                    return u;
                }
            }
        }
        return null;
    }
  
    //This function is used to get the caller gym name from the request headers 
    // and cookies and all the details about the gym 
    private String getCallerGymName(HttpServletRequest request, List<ZCRowObject> allUsers) {
        String headerGym = request.getHeader("x-gym-name");
        if (headerGym != null && !headerGym.trim().isEmpty() && !isGenericGymName(headerGym)) {
            return formatGymTitle(headerGym.trim());
        }
        String paramGym = request.getParameter("gym_name");
        if (paramGym != null && !paramGym.trim().isEmpty() && !isGenericGymName(paramGym)) {
            return formatGymTitle(paramGym.trim());
        }
        JSONObject caller = getCallerUser(request, allUsers);
        if (caller != null) {
            return resolveGymName(caller, allUsers);
        }
        return null;
    }

    private String resolveGymName(JSONObject userObj, List<ZCRowObject> allUsers) {
        if (userObj == null) {
            return cachedFacilityGymName != null ? cachedFacilityGymName : "Sabari Fitness";
        }

        String direct = userObj.optString("gym_name", userObj.optString("gymName", "")).trim();
        if (!isGenericGymName(direct)) {
            return formatGymTitle(direct);
        }

        String ec = userObj.optString("emergencyContact", userObj.optString("emergency_contact", "")).trim();
        if (!isGenericGymName(ec)) {
            if (ec.toLowerCase().startsWith("gym:") || ec.toLowerCase().startsWith("gym :")) {
                String parsed = ec.substring(ec.indexOf(':') + 1).trim();
                if (!isGenericGymName(parsed)) {
                    return formatGymTitle(parsed);
                }
            } else if (!ec.startsWith("+") && !ec.matches("^[0-9\\s\\-\\(\\)]{7,}$")) {
                return formatGymTitle(ec);
            }
        }

        String assigned = userObj.optString("assignedTrainer", userObj.optString("assigned_trainer_id", "")).trim();
        if (!assigned.isEmpty() && !"None".equalsIgnoreCase(assigned) && !"Self".equalsIgnoreCase(assigned) && allUsers != null) {
            for (ZCRowObject r : allUsers) {
                JSONObject u = rowToJson(r);
                if (assigned.equals(String.valueOf(u.opt("ROWID"))) || assigned.equalsIgnoreCase(u.optString("name")) || assigned.equalsIgnoreCase(u.optString("email"))) {
                    String tGym = resolveGymName(u, null);
                    if (!isGenericGymName(tGym)) {
                        return tGym;
                    }
                }
            }
        }
        //if the user is owner then return the first name of the user as the gym name
        //  else return the gym name from the user object
        String role = userObj.optString("role", userObj.optString("user_role", "")).trim();
        boolean isOwner = "Owner".equalsIgnoreCase(role);
        if (isOwner) {
            String fName = userObj.optString("user_first_name", "");
            if (fName.isEmpty()) {
                String fullName = userObj.optString("name", "");
                if (!fullName.isEmpty()) fName = fullName.split(" ")[0];
            }
            if (!fName.isEmpty() && !"Gym".equalsIgnoreCase(fName) && !"User".equalsIgnoreCase(fName)) {
                return formatGymTitle(fName.trim() + " Fitness");
            }
        }

        return cachedFacilityGymName != null ? cachedFacilityGymName : "Sabari Fitness";
    }

    private String resolveRecordGym(JSONObject record, List<ZCRowObject> allUsers) {
        if (record == null) return "Sabari Fitness";

        // 1. Direct member match in GymUsers
        String mId = record.optString("memberId", record.optString("sub_member_id", record.optString("att_member_id", record.optString("workout_member_id", record.optString("prog_member_id", record.optString("pay_member_id", "")))))).trim();
        String mName = record.optString("memberName", record.optString("workout_member_name", record.optString("name", ""))).trim();

        if (allUsers != null) {
            for (ZCRowObject uRow : allUsers) {
                JSONObject u = rowToJson(uRow);
                String uId = String.valueOf(u.opt("ROWID")).trim();
                String uName = u.optString("name", (u.optString("user_first_name") + " " + u.optString("user_last_name")).trim()).trim();
                String uEmail = u.optString("email", "").trim();

                boolean idMatch = !mId.isEmpty() && mId.equals(uId);
                boolean nameMatch = !mName.isEmpty() && (mName.equalsIgnoreCase(uName) || mName.equalsIgnoreCase(uEmail));

                if (idMatch || nameMatch) {
                    return resolveGymName(u, allUsers);
                }
            }
        }

        // 2. Direct trainer match in GymUsers
        String tId = record.optString("trainerId", record.optString("workout_trainer_id", "")).trim();
        String tName = record.optString("trainerName", record.optString("workout_trainer_name", "")).trim();
        if (allUsers != null && (!tId.isEmpty() || !tName.isEmpty())) {
            for (ZCRowObject uRow : allUsers) {
                JSONObject u = rowToJson(uRow);
                String uId = String.valueOf(u.opt("ROWID")).trim();
                String uName = u.optString("name", (u.optString("user_first_name") + " " + u.optString("user_last_name")).trim()).trim();
                String uEmail = u.optString("email", "").trim();

                boolean idMatch = !tId.isEmpty() && tId.equals(uId);
                boolean nameMatch = !tName.isEmpty() && (tName.equalsIgnoreCase(uName) || tName.equalsIgnoreCase(uEmail));

                if (idMatch || nameMatch) {
                    return resolveGymName(u, allUsers);
                }
            }
        }

        // 3. Check record's direct gymName / gym_name
        String directGym = record.optString("gym_name", record.optString("gymName", "")).trim();
        if (!isGenericGymName(directGym)) {
            return formatGymTitle(directGym);
        }

        return "Sabari Fitness";
    }

    // =========================================================================
    // OTP & EMAIL HELPER METHODS
    // =========================================================================
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static String generateOtp() {
        int code = 100000 + SECURE_RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    private static Properties loadMailProperties() {
        Properties props = new Properties();
        // 1. Defaults
        props.setProperty("SMTP_HOST", "smtp.gmail.com");
        props.setProperty("SMTP_PORT", "465");
        props.setProperty("SMTP_USER", "sabarinathanpbmail@gmail.com");
        props.setProperty("SMTP_PASSWORD", "abgadyowqzzfefio");
        props.setProperty("FROM_NAME", "Aurum Gym Management");

        // 2. Try file in working dir or classpath
        try {
            File f = new File("mail.properties");
            if (f.exists()) {
                try (InputStream in = new FileInputStream(f)) {
                    props.load(in);
                }
            } else {
                InputStream cpIn = Sample.class.getClassLoader().getResourceAsStream("mail.properties");
                if (cpIn != null) {
                    try (cpIn) {
                        props.load(cpIn);
                    }
                }
            }
        } catch (Exception e) {
            LOGGER.log(Level.FINE, "Could not load mail.properties file: " + e.getMessage());
        }

        // 3. Environment variable overrides
        String envUser = System.getenv("SMTP_USER");
        if (envUser != null && !envUser.trim().isEmpty()) props.setProperty("SMTP_USER", envUser.trim());
        String envPass = System.getenv("SMTP_PASSWORD");
        if (envPass != null && !envPass.trim().isEmpty()) props.setProperty("SMTP_PASSWORD", envPass.trim());
        String envHost = System.getenv("SMTP_HOST");
        if (envHost != null && !envHost.trim().isEmpty()) props.setProperty("SMTP_HOST", envHost.trim());
        String envPort = System.getenv("SMTP_PORT");
        if (envPort != null && !envPort.trim().isEmpty()) props.setProperty("SMTP_PORT", envPort.trim());
        String envFromName = System.getenv("FROM_NAME");
        if (envFromName != null && !envFromName.trim().isEmpty()) props.setProperty("FROM_NAME", envFromName.trim());

        return props;
    }

    private static boolean sendOtpEmail(String recipientEmail, String recipientName, String gymName, String otpCode) {
        LOGGER.info("[OTP DISPATCH] Initiating OTP delivery for: " + recipientEmail + " | Code: " + otpCode);

        Properties props = loadMailProperties();
        String host = props.getProperty("SMTP_HOST", "smtp.gmail.com");
        int port = 465;
        try {
            port = Integer.parseInt(props.getProperty("SMTP_PORT", "465"));
        } catch (Exception ignored) {}
        String user = props.getProperty("SMTP_USER", "").trim();
        String pass = props.getProperty("SMTP_PASSWORD", "").trim();
        String fromName = props.getProperty("FROM_NAME", "Aurum Gym Management").trim();

        String subject = "Your Aurum Gym Verification Code: " + otpCode;
        String htmlBody = "<!DOCTYPE html><html><body style=\"font-family: Arial, sans-serif; background-color: #F8F8F6; margin: 0; padding: 24px;\">"
                + "<div style=\"max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #E8E5DC; border-radius: 12px; overflow: hidden; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);\">"
                + "  <div style=\"display: flex; align-items: center; margin-bottom: 20px;\">"
                + "    <div style=\"background: linear-gradient(135deg, #C9A227, #A67C00); width: 40px; height: 40px; border-radius: 10px; color: #ffffff; font-weight: bold; font-size: 1.2rem; line-height: 40px; text-align: center; display: inline-block; margin-right: 12px;\">A</div>"
                + "    <div>"
                + "      <h2 style=\"margin: 0; color: #242424; font-size: 1.2rem;\">Aurum Gym Management</h2>"
                + "      <span style=\"font-size: 0.78rem; color: #A67C00; font-weight: bold;\">Owner Registration & Security Verification</span>"
                + "    </div>"
                + "  </div>"
                + "  <p style=\"color: #242424; font-size: 1rem; line-height: 1.5;\">Hello <strong>" + escapeHtml(recipientName) + "</strong>,</p>"
                + "  <p style=\"color: #555555; font-size: 0.92rem; line-height: 1.6;\">Thank you for registering <strong>" + escapeHtml(gymName) + "</strong> with Aurum Gym Management System. Use the 6-digit verification code below to verify your account and access your Gym Owner dashboard:</p>"
                + "  <div style=\"background: #FAF6ED; border: 1px dashed #C9A227; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;\">"
                + "    <div style=\"font-size: 0.76rem; font-weight: bold; color: #A67C00; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;\">Your 6-Digit OTP Code</div>"
                + "    <span style=\"font-size: 2.2rem; font-weight: 800; letter-spacing: 10px; color: #A67C00; font-family: monospace;\">" + otpCode + "</span>"
                + "  </div>"
                + "  <p style=\"color: #707070; font-size: 0.82rem; line-height: 1.5;\">This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.</p>"
                + "  <hr style=\"border: none; border-top: 1px solid #F0EDE5; margin: 24px 0;\" />"
                + "  <p style=\"color: #999890; font-size: 0.76rem; margin: 0;\">If you did not request this verification code, please ignore this email. &copy; Aurum Gym Management System.</p>"
                + "</div></body></html>";

        // Attempt 1: Gmail SMTP over SSL (Port 465) if credentials exist
        if (!user.isEmpty() && !pass.isEmpty()) {
            try {
                boolean sent = sendViaSmtp(host, port, user, pass, fromName, recipientEmail, subject, htmlBody);
                if (sent) {
                    LOGGER.info("[OTP DISPATCH] Successfully delivered OTP email via SMTP to: " + recipientEmail);
                    return true;
                }
            } catch (Exception e) {
                LOGGER.log(Level.WARNING, "[OTP DISPATCH] SMTP failed: " + e.getMessage(), e);
            }
        } else {
            LOGGER.info("[OTP DISPATCH] SMTP_PASSWORD is not configured in mail.properties. Attempting Catalyst ZCMail fallback...");
        }

        // Attempt 2: Catalyst ZCMail as fallback
        try {
            ZCMail mail = ZCMail.getInstance();
            ZCMailContent content = ZCMailContent.getInstance();
            content.setFromEmail(user.isEmpty() ? "sabarinathanpbmail@gmail.com" : user);
            content.setDisplayName(fromName);
            content.setToEmail(recipientEmail);
            content.setSubject(subject);
            content.setContent(htmlBody);
            content.setHtmlMode(true);
            mail.sendMail(content);
            LOGGER.info("[OTP DISPATCH] Successfully delivered OTP email via Catalyst ZCMail to: " + recipientEmail);
            return true;
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "[OTP DISPATCH] Catalyst ZCMail fallback error: " + e.getMessage());
        }

        return false;
    }

    private static boolean sendInvitationEmail(String recipientEmail, String recipientName, String gymName, String role, String setPasswordUrl) {
        LOGGER.info("[INVITE DISPATCH] Initiating invitation email delivery for: " + recipientEmail + " | Role: " + role);

        Properties props = loadMailProperties();
        String host = props.getProperty("SMTP_HOST", "smtp.gmail.com");
        int port = 465;
        try {
            port = Integer.parseInt(props.getProperty("SMTP_PORT", "465"));
        } catch (Exception ignored) {}
        String user = props.getProperty("SMTP_USER", "sabarinathanpbmail@gmail.com").trim();
        String pass = props.getProperty("SMTP_PASSWORD", "abgadyowqzzfefio").trim();
        String fromName = props.getProperty("FROM_NAME", "Aurum Gym Management").trim();

        String gymTitle = (gymName == null || gymName.trim().isEmpty()) ? "Aurum Fitness Club" : gymName.trim();
        String roleTitle = (role == null || role.trim().isEmpty()) ? "Member" : role.trim();
        String subject = "Welcome to " + gymTitle + "! Set Your Password (" + roleTitle + ")";
        String htmlBody = "<!DOCTYPE html><html><body style=\"font-family: Arial, sans-serif; background-color: #F8F8F6; margin: 0; padding: 24px;\">"
                + "<div style=\"max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #E8E5DC; border-radius: 12px; overflow: hidden; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);\">"
                + "  <div style=\"display: flex; align-items: center; margin-bottom: 24px;\">"
                + "    <div style=\"background: linear-gradient(135deg, #C9A227, #A67C00); width: 44px; height: 44px; border-radius: 10px; color: #ffffff; font-weight: bold; font-size: 1.3rem; line-height: 44px; text-align: center; display: inline-block; margin-right: 14px;\">A</div>"
                + "    <div>"
                + "      <h2 style=\"margin: 0; color: #242424; font-size: 1.25rem;\">Aurum Gym Management</h2>"
                + "      <span style=\"font-size: 0.8rem; color: #A67C00; font-weight: bold;\">Team &amp; Member Invitation</span>"
                + "    </div>"
                + "  </div>"
                + "  <p style=\"color: #242424; font-size: 1.05rem; line-height: 1.5; margin-top: 0;\">Hello <strong>" + escapeHtml(recipientName) + "</strong>,</p>"
                + "  <p style=\"color: #4A4A4A; font-size: 0.95rem; line-height: 1.6;\">You have been invited by the Gym Owner to join <strong>" + escapeHtml(gymTitle) + "</strong> with authorized access as a <strong>" + escapeHtml(roleTitle) + "</strong>.</p>"
                + "  <div style=\"background: #FAF8F5; border: 1px solid #E8D293; border-radius: 10px; padding: 18px 20px; margin: 24px 0;\">"
                + "    <div style=\"font-size: 0.78rem; text-transform: uppercase; color: #874D00; font-weight: bold; letter-spacing: 0.8px; margin-bottom: 8px;\">Invitation Summary</div>"
                + "    <div style=\"font-size: 0.9rem; color: #242424; line-height: 1.6;\">"
                + "      <div><strong>Gym / Facility:</strong> " + escapeHtml(gymTitle) + "</div>"
                + "      <div><strong>Assigned Role:</strong> <span style=\"color: #C9A227; font-weight: bold;\">" + escapeHtml(roleTitle) + "</span></div>"
                + "      <div><strong>Invited Email:</strong> " + escapeHtml(recipientEmail) + "</div>"
                + "    </div>"
                + "  </div>"
                + "  <p style=\"color: #4A4A4A; font-size: 0.95rem; line-height: 1.6;\">Please click the button below to set your account password and activate your access:</p>"
                + "  <div style=\"text-align: center; margin: 30px 0;\">"
                + "    <a href=\"" + setPasswordUrl + "\" style=\"background: linear-gradient(135deg, #C9A227 0%, #A67C00 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.96rem; display: inline-block; box-shadow: 0 4px 14px rgba(201, 162, 39, 0.35);\">"
                + "      Set Your Password &amp; Activate Account &rarr;"
                + "    </a>"
                + "  </div>"
                + "  <p style=\"color: #707070; font-size: 0.84rem; line-height: 1.5;\">Once your password is configured, you will be automatically signed in and redirected straight to your <strong>" + escapeHtml(roleTitle) + " Dashboard</strong>.</p>"
                + "  <div style=\"background: #F8F8F6; border-radius: 8px; padding: 12px; margin-top: 20px; word-break: break-all;\">"
                + "    <span style=\"font-size: 0.75rem; color: #888888; display: block; margin-bottom: 4px;\">If the button doesn't work, copy and paste this link into your browser:</span>"
                + "    <a href=\"" + setPasswordUrl + "\" style=\"font-size: 0.78rem; color: #A67C00;\">" + setPasswordUrl + "</a>"
                + "  </div>"
                + "  <hr style=\"border: none; border-top: 1px solid #F0EDE5; margin: 28px 0 20px 0;\" />"
                + "  <p style=\"color: #999890; font-size: 0.76rem; margin: 0; line-height: 1.4;\">This invitation link is valid for <strong>48 hours</strong>. If you did not expect this invitation, you can safely ignore this email.<br />&copy; Aurum Gym Management System.</p>"
                + "</div></body></html>";

        // Attempt 1: Gmail SMTP over SSL (Port 465)
        if (!user.isEmpty() && !pass.isEmpty()) {
            try {
                boolean sent = sendViaSmtp(host, port, user, pass, fromName, recipientEmail, subject, htmlBody);
                if (sent) {
                    LOGGER.info("[INVITE DISPATCH] Successfully delivered invitation email via SMTP to: " + recipientEmail);
                    return true;
                }
            } catch (Exception e) {
                LOGGER.log(Level.WARNING, "[INVITE DISPATCH] SMTP failed: " + e.getMessage(), e);
            }
        }

        // Attempt 2: Catalyst ZCMail fallback
        try {
            ZCMail mail = ZCMail.getInstance();
            ZCMailContent content = ZCMailContent.getInstance();
            content.setFromEmail(user.isEmpty() ? "sabarinathanpbmail@gmail.com" : user);
            content.setDisplayName(fromName);
            content.setToEmail(recipientEmail);
            content.setSubject(subject);
            content.setContent(htmlBody);
            content.setHtmlMode(true);
            mail.sendMail(content);
            LOGGER.info("[INVITE DISPATCH] Successfully delivered invitation email via Catalyst ZCMail to: " + recipientEmail);
            return true;
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "[INVITE DISPATCH] Catalyst ZCMail fallback error: " + e.getMessage());
        }

        return false;
    }

    private static boolean sendViaSmtp(String host, int port, String user, String pass, String fromName, String to, String subject, String htmlBody) throws Exception {
        SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
        try (SSLSocket socket = (SSLSocket) factory.createSocket(host, port)) {
            socket.setSoTimeout(15000);
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), "UTF-8"));
            PrintWriter writer = new PrintWriter(new OutputStreamWriter(socket.getOutputStream(), "UTF-8"), true);

            expectSmtpResponse(reader, "220");

            sendSmtpCommand(writer, "EHLO localhost");
            readSmtpUntilPrefix(reader, "250 ");

            sendSmtpCommand(writer, "AUTH LOGIN");
            expectSmtpResponse(reader, "334");

            sendSmtpCommand(writer, Base64.getEncoder().encodeToString(user.getBytes("UTF-8")));
            expectSmtpResponse(reader, "334");

            sendSmtpCommand(writer, Base64.getEncoder().encodeToString(pass.replace(" ", "").getBytes("UTF-8")));
            expectSmtpResponse(reader, "235");

            sendSmtpCommand(writer, "MAIL FROM:<" + user + ">");
            expectSmtpResponse(reader, "250");

            sendSmtpCommand(writer, "RCPT TO:<" + to + ">");
            expectSmtpResponse(reader, "250");

            sendSmtpCommand(writer, "DATA");
            expectSmtpResponse(reader, "354");

            String fromHeader = (fromName != null && !fromName.isEmpty()) ? fromName + " <" + user + ">" : user;
            writer.print("From: " + fromHeader + "\r\n");
            writer.print("To: <" + to + ">\r\n");
            writer.print("Subject: " + subject + "\r\n");
            writer.print("MIME-Version: 1.0\r\n");
            writer.print("Content-Type: text/html; charset=UTF-8\r\n");
            writer.print("\r\n");
            writer.print(htmlBody + "\r\n");
            writer.print(".\r\n");
            writer.flush();

            expectSmtpResponse(reader, "250");

            sendSmtpCommand(writer, "QUIT");
            return true;
        }
    }

    private static void sendSmtpCommand(PrintWriter writer, String cmd) {
        writer.print(cmd + "\r\n");
        writer.flush();
    }

    private static String expectSmtpResponse(BufferedReader reader, String expectedCode) throws IOException {
        String line = reader.readLine();
        if (line == null || !line.startsWith(expectedCode)) {
            throw new IOException("Unexpected SMTP response. Expected code: " + expectedCode + ", Got: " + line);
        }
        return line;
    }

    private static void readSmtpUntilPrefix(BufferedReader reader, String prefix) throws IOException {
        String line;
        while ((line = reader.readLine()) != null) {
            if (line.startsWith(prefix)) break;
        }
    }

    private static String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}