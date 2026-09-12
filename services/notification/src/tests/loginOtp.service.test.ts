import { createHash } from "node:crypto";
import { requestLoginOtp, verifyLoginOtp } from "../services/loginOtp.service";
import { getAdminClient, getAnonClient } from "../lib/supabase";
import { loadEnv } from "../lib/env";
import { sendFast2Sms, sendSms, sendTwoFactorAutogenSms } from "../services/sms.service";
import { sendOtpWhatsApp } from "../services/whatsapp.service";

jest.mock("../lib/supabase", () => ({
  getAdminClient: jest.fn(),
  getAnonClient: jest.fn(),
}));

jest.mock("../lib/env", () => ({
  loadEnv: jest.fn(),
}));

jest.mock("../services/sms.service", () => ({
  sendSms: jest.fn(),
  sendFast2Sms: jest.fn(),
  sendTwoFactorAutogenSms: jest.fn(),
}));

jest.mock("../services/whatsapp.service", () => ({
  sendOtpWhatsApp: jest.fn(),
}));

const mockedGetAdminClient = getAdminClient as jest.MockedFunction<typeof getAdminClient>;
const mockedGetAnonClient = getAnonClient as jest.MockedFunction<typeof getAnonClient>;
const mockedLoadEnv = loadEnv as jest.MockedFunction<typeof loadEnv>;
const mockedSendSms = sendSms as jest.MockedFunction<typeof sendSms>;
const mockedSendFast2Sms = sendFast2Sms as jest.MockedFunction<typeof sendFast2Sms>;
const mockedSendTwoFactorAutogenSms = sendTwoFactorAutogenSms as jest.MockedFunction<typeof sendTwoFactorAutogenSms>;
const mockedSendOtpWhatsApp = sendOtpWhatsApp as jest.MockedFunction<typeof sendOtpWhatsApp>;

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

// A minimal fluent stand-in for the Supabase query builder: select/eq/update/delete
// all return the same chainable object, and the terminal methods resolve like the
// real client would (`{ data, error }`).
function makeTable(overrides: { maybeSingleResult?: { data: unknown; error: unknown }; upsertResult?: { error: unknown } } = {}) {
  const table: Record<string, jest.Mock> = {};
  table.select = jest.fn(() => table);
  table.eq = jest.fn(() => table);
  table.update = jest.fn(() => table);
  table.delete = jest.fn(() => table);
  table.maybeSingle = jest.fn().mockResolvedValue(overrides.maybeSingleResult ?? { data: null, error: null });
  table.upsert = jest.fn().mockResolvedValue(overrides.upsertResult ?? { error: null });
  return table;
}

const NO_PRIOR_SEND = { data: null, error: null };

const NON_TEST_PHONE = "+919876543210";
const TEST_BYPASS_PHONE = "+919789631081"; // baked into loginOtp.service.ts's dev/QA allowlist

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("requestLoginOtp", () => {
  it("refuses a resend inside the cooldown window without contacting any provider", async () => {
    const otpsTable = makeTable({
      maybeSingleResult: { data: { last_sent_at: new Date().toISOString() }, error: null },
    });
    mockedGetAdminClient.mockReturnValue({ from: jest.fn(() => otpsTable) } as never);

    await expect(requestLoginOtp(NON_TEST_PHONE)).rejects.toThrow("Please wait before requesting another OTP");

    expect(mockedSendTwoFactorAutogenSms).not.toHaveBeenCalled();
    expect(mockedSendOtpWhatsApp).not.toHaveBeenCalled();
    expect(mockedSendFast2Sms).not.toHaveBeenCalled();
    expect(mockedSendSms).not.toHaveBeenCalled();
  });

  it("uses the fixed dev/QA OTP for the allowlisted test phone and sends no real SMS", async () => {
    const otpsTable = makeTable({ maybeSingleResult: NO_PRIOR_SEND });
    mockedGetAdminClient.mockReturnValue({ from: jest.fn(() => otpsTable) } as never);

    await requestLoginOtp(TEST_BYPASS_PHONE);

    expect(otpsTable.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ phone: TEST_BYPASS_PHONE, otp_hash: hashOtp("123456") })
    );
    expect(mockedSendTwoFactorAutogenSms).not.toHaveBeenCalled();
    expect(mockedSendOtpWhatsApp).not.toHaveBeenCalled();
    expect(mockedSendFast2Sms).not.toHaveBeenCalled();
    expect(mockedSendSms).not.toHaveBeenCalled();
  });

  it("delivers via 2Factor AUTOGEN2 first and does not fall through when it succeeds", async () => {
    const otpsTable = makeTable({ maybeSingleResult: NO_PRIOR_SEND });
    mockedGetAdminClient.mockReturnValue({ from: jest.fn(() => otpsTable) } as never);
    mockedLoadEnv.mockReturnValue({
      TWOFACTOR_API_KEY: "2factor-key",
      GUPSHUP_API_KEY: "",
      GUPSHUP_SOURCE_NUMBER: "",
      GUPSHUP_OTP_TEMPLATE_ID: "",
    } as never);
    mockedSendTwoFactorAutogenSms.mockResolvedValue("654321");

    await requestLoginOtp(NON_TEST_PHONE);

    expect(mockedSendTwoFactorAutogenSms).toHaveBeenCalledWith(NON_TEST_PHONE);
    expect(otpsTable.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ otp_hash: hashOtp("654321") })
    );
    expect(mockedSendOtpWhatsApp).not.toHaveBeenCalled();
    expect(mockedSendFast2Sms).not.toHaveBeenCalled();
    expect(mockedSendSms).not.toHaveBeenCalled();
  });

  it("falls through to Fast2SMS when 2Factor and WhatsApp are unavailable", async () => {
    const otpsTable = makeTable({ maybeSingleResult: NO_PRIOR_SEND });
    mockedGetAdminClient.mockReturnValue({ from: jest.fn(() => otpsTable) } as never);
    mockedLoadEnv.mockReturnValue({
      TWOFACTOR_API_KEY: "",
      GUPSHUP_API_KEY: "",
      GUPSHUP_SOURCE_NUMBER: "",
      GUPSHUP_OTP_TEMPLATE_ID: "",
    } as never);
    mockedSendFast2Sms.mockResolvedValue(undefined);

    await requestLoginOtp(NON_TEST_PHONE);

    expect(mockedSendTwoFactorAutogenSms).not.toHaveBeenCalled();
    expect(mockedSendOtpWhatsApp).not.toHaveBeenCalled();
    expect(mockedSendFast2Sms).toHaveBeenCalledWith(NON_TEST_PHONE, expect.any(String));
    expect(mockedSendSms).not.toHaveBeenCalled();
  });

  it("falls all the way through to MSG91 when every earlier provider fails", async () => {
    const otpsTable = makeTable({ maybeSingleResult: NO_PRIOR_SEND });
    mockedGetAdminClient.mockReturnValue({ from: jest.fn(() => otpsTable) } as never);
    mockedLoadEnv.mockReturnValue({
      TWOFACTOR_API_KEY: "2factor-key",
      GUPSHUP_API_KEY: "gupshup-key",
      GUPSHUP_SOURCE_NUMBER: "911234567890",
      GUPSHUP_OTP_TEMPLATE_ID: "template-1",
    } as never);
    mockedSendTwoFactorAutogenSms.mockRejectedValue(new Error("2factor down"));
    mockedSendOtpWhatsApp.mockRejectedValue(new Error("gupshup down"));
    mockedSendFast2Sms.mockRejectedValue(new Error("fast2sms down"));
    mockedSendSms.mockResolvedValue(undefined);

    await requestLoginOtp(NON_TEST_PHONE);

    expect(mockedSendTwoFactorAutogenSms).toHaveBeenCalled();
    expect(mockedSendOtpWhatsApp).toHaveBeenCalled();
    expect(mockedSendFast2Sms).toHaveBeenCalled();
    expect(mockedSendSms).toHaveBeenCalledWith(NON_TEST_PHONE, expect.any(String));
  });
});

describe("verifyLoginOtp", () => {
  it("rejects when no OTP request exists for the phone", async () => {
    const otpsTable = makeTable({ maybeSingleResult: { data: null, error: null } });
    mockedGetAdminClient.mockReturnValue({ from: jest.fn(() => otpsTable) } as never);

    await expect(verifyLoginOtp(NON_TEST_PHONE, "123456")).rejects.toThrow(
      "No OTP request found for this number"
    );
  });

  it("rejects an expired OTP", async () => {
    const otpsTable = makeTable({
      maybeSingleResult: {
        data: { otp_hash: hashOtp("123456"), expires_at: new Date(Date.now() - 60_000).toISOString(), attempts: 0 },
        error: null,
      },
    });
    mockedGetAdminClient.mockReturnValue({ from: jest.fn(() => otpsTable) } as never);

    await expect(verifyLoginOtp(NON_TEST_PHONE, "123456")).rejects.toThrow(
      "OTP has expired, please request a new one"
    );
  });

  it("rejects once the attempt limit has been reached", async () => {
    const otpsTable = makeTable({
      maybeSingleResult: {
        data: { otp_hash: hashOtp("123456"), expires_at: new Date(Date.now() + 60_000).toISOString(), attempts: 5 },
        error: null,
      },
    });
    mockedGetAdminClient.mockReturnValue({ from: jest.fn(() => otpsTable) } as never);

    await expect(verifyLoginOtp(NON_TEST_PHONE, "123456")).rejects.toThrow(
      "Too many incorrect attempts, please request a new OTP"
    );
  });

  it("rejects an incorrect OTP and records the failed attempt", async () => {
    const otpsTable = makeTable({
      maybeSingleResult: {
        data: { otp_hash: hashOtp("123456"), expires_at: new Date(Date.now() + 60_000).toISOString(), attempts: 1 },
        error: null,
      },
    });
    mockedGetAdminClient.mockReturnValue({ from: jest.fn(() => otpsTable) } as never);

    await expect(verifyLoginOtp(NON_TEST_PHONE, "000000")).rejects.toThrow("Incorrect OTP");

    expect(otpsTable.update).toHaveBeenCalledWith({ attempts: 2 });
  });

  it("mints a session and deletes the OTP row on a correct match", async () => {
    const otpsTable = makeTable({
      maybeSingleResult: {
        data: { otp_hash: hashOtp("123456"), expires_at: new Date(Date.now() + 60_000).toISOString(), attempts: 0 },
        error: null,
      },
    });
    const usersTable = makeTable({
      maybeSingleResult: { data: { supabase_auth_id: "auth-uuid-123" }, error: null },
    });
    const adminAuth = {
      admin: {
        updateUserById: jest.fn().mockResolvedValue({ error: null }),
        createUser: jest.fn(),
        listUsers: jest.fn(),
        generateLink: jest.fn().mockResolvedValue({
          data: { properties: { hashed_token: "hashed-token-abc" } },
          error: null,
        }),
      },
    };
    const fakeSession = { access_token: "at", refresh_token: "rt", user: { id: "auth-uuid-123" } };
    mockedGetAdminClient.mockReturnValue({
      from: jest.fn((table: string) => (table === "users" ? usersTable : otpsTable)),
      auth: adminAuth,
    } as never);
    mockedGetAnonClient.mockReturnValue({
      auth: {
        verifyOtp: jest.fn().mockResolvedValue({ data: { session: fakeSession }, error: null }),
      },
    } as never);

    const session = await verifyLoginOtp(NON_TEST_PHONE, "123456");

    expect(session).toBe(fakeSession);
    expect(otpsTable.delete).toHaveBeenCalled();
    expect(adminAuth.admin.createUser).not.toHaveBeenCalled();
    expect(adminAuth.admin.generateLink).toHaveBeenCalledWith(
      expect.objectContaining({ type: "magiclink" })
    );
  });
});
