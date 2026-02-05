import { 
  registerUser as apiRegister, 
  requestLoginOtp, 
  verifyOtpAndGetToken, 
  fetchProfile,
  RegisterPayload 
} from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -1 Register
export const registerUser = async (data: any) => {
    // Adapter to match RegisterPayload
    const payload: RegisterPayload = {
        full_name: data.full_name || data.name,
        phone_number: data.phone_number || data.phone,
        email: data.email,
        password: data.password,
        role: data.role || 'user'
    };
    return await apiRegister(payload);
};

// 1️⃣ Send OTP
export const requestOtp = async (email: string, phone: string) => {
  const payload: any = {};
  if (email) payload.email = email;
  if (phone) payload.phone_number = phone;

  return await requestLoginOtp(payload);
};

// 2️⃣ Verify OTP & Login
export const verifyOtp = async (email: string | null, otp: string, phone?: string | null) => {
  const payload: any = { otp_code: otp };
  if (email) payload.email = email;
  if (phone) payload.phone_number = phone;

  const res = await verifyOtpAndGetToken(payload);
  
  if (res.access) {
      await AsyncStorage.setItem("access_token", res.access);
  }
  if (res.refresh) {
      await AsyncStorage.setItem("refresh_token", res.refresh);
  }
  return res;
};

// 3️⃣ Login (JWT) - Deprecated / wrapped by verifyOtp
export const login = async (phone: string, password: string) => {
  // If we need password login later, use api.passwordLogin
  return {};
};

// 4️⃣ Logged in user
export const getMe = async () => {
  return await fetchProfile();
};

// 5️⃣ Logout
export const logout = async () => {
  await AsyncStorage.multiRemove(["access_token", "refresh_token", "user", "role"]);
};