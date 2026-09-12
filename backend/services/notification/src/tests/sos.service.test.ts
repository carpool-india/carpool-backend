import { dispatchSos, type SosDispatchInput } from "../services/sos.service";
import { sendSms } from "../services/sms.service";
import { sendPush } from "../services/fcm.service";

jest.mock("../services/sms.service", () => ({
  sendSms: jest.fn(),
}));

jest.mock("../services/fcm.service", () => ({
  sendPush: jest.fn(),
}));

const mockedSendSms = sendSms as jest.MockedFunction<typeof sendSms>;
const mockedSendPush = sendPush as jest.MockedFunction<typeof sendPush>;

function baseInput(overrides: Partial<SosDispatchInput> = {}): SosDispatchInput {
  return {
    userName: "Rahul",
    userPhone: "+919876543210",
    lat: 12.9716,
    lng: 77.5946,
    tripId: "11111111-1111-1111-1111-111111111111",
    emergencyContacts: [
      { name: "Mom", phone: "+919876500001" },
      { name: "Dad", phone: "+919876500002" },
    ],
    adminFcmTokens: ["admin-token-1", "admin-token-2"],
    ...overrides,
  };
}

describe("dispatchSos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("never claims police were notified", async () => {
    mockedSendSms.mockResolvedValue(undefined);
    mockedSendPush.mockResolvedValue("push-id");

    const result = await dispatchSos(baseInput());

    expect(result.policeNotified).toBe(false);
  });

  it("SMSes every emergency contact and pushes every admin token", async () => {
    mockedSendSms.mockResolvedValue(undefined);
    mockedSendPush.mockResolvedValue("push-id");

    const input = baseInput();
    await dispatchSos(input);

    expect(mockedSendSms).toHaveBeenCalledTimes(input.emergencyContacts.length);
    expect(mockedSendSms).toHaveBeenCalledWith(
      "+919876500001",
      expect.stringContaining("Contact: Mom")
    );
    expect(mockedSendSms).toHaveBeenCalledWith(
      "+919876500002",
      expect.stringContaining("Contact: Dad")
    );

    // One push per admin token, plus none for the user ack since userFcmToken wasn't given.
    expect(mockedSendPush).toHaveBeenCalledTimes(input.adminFcmTokens.length);
    for (const token of input.adminFcmTokens) {
      expect(mockedSendPush).toHaveBeenCalledWith(
        expect.objectContaining({ token, data: expect.objectContaining({ type: "sos_admin" }) })
      );
    }
  });

  it("keeps notifying the remaining contacts and admins when some sends reject (Promise.allSettled fan-out)", async () => {
    // This is the exact regression the allSettled rewrite fixed: a naive
    // sequential loop that awaits each send in turn would stop (or throw) on the
    // first rejection and never reach the remaining contacts/admins.
    mockedSendSms
      .mockRejectedValueOnce(new Error("carrier down"))
      .mockResolvedValueOnce(undefined);
    mockedSendPush
      .mockResolvedValueOnce("push-id-1")
      .mockRejectedValueOnce(new Error("invalid token"));

    await expect(dispatchSos(baseInput())).resolves.toBeDefined();

    expect(mockedSendSms).toHaveBeenCalledTimes(2);
    expect(mockedSendPush).toHaveBeenCalledTimes(2);
  });

  it("does not throw when every contact and admin send rejects", async () => {
    mockedSendSms.mockRejectedValue(new Error("carrier down"));
    mockedSendPush.mockRejectedValue(new Error("invalid token"));

    await expect(dispatchSos(baseInput())).resolves.toEqual(
      expect.objectContaining({ policeNotified: false, contactsNotified: 0, adminAlerted: 0 })
    );
  });

  it("returns contactsNotified/adminAlerted reflecting only the successful sends, not the input array length", async () => {
    mockedSendSms
      .mockRejectedValueOnce(new Error("carrier down"))
      .mockResolvedValueOnce(undefined);
    mockedSendPush
      .mockResolvedValueOnce("push-id-1")
      .mockRejectedValueOnce(new Error("invalid token"));

    const input = baseInput({ adminFcmTokens: ["admin-token-1", "admin-token-2"] });
    const result = await dispatchSos(input);

    expect(input.emergencyContacts).toHaveLength(2);
    expect(input.adminFcmTokens).toHaveLength(2);
    expect(result.contactsNotified).toBe(1);
    expect(result.adminAlerted).toBe(1);
  });

  it("also pushes an acknowledgement to the reporting user's own FCM token when provided", async () => {
    mockedSendSms.mockResolvedValue(undefined);
    mockedSendPush.mockResolvedValue("push-id");

    await dispatchSos(baseInput({ userFcmToken: "user-token" }));

    expect(mockedSendPush).toHaveBeenCalledWith(
      expect.objectContaining({ token: "user-token", data: expect.objectContaining({ type: "sos" }) })
    );
  });

  it("does not fail the whole dispatch if the user acknowledgement push fails", async () => {
    mockedSendSms.mockResolvedValue(undefined);
    mockedSendPush.mockImplementation(async (input) => {
      if (input.token === "user-token") {
        throw new Error("token expired");
      }
      return "push-id";
    });

    const result = await dispatchSos(baseInput({ userFcmToken: "user-token" }));

    expect(result.adminAlerted).toBe(2);
  });

  it("handles zero emergency contacts and zero admin tokens without error", async () => {
    const result = await dispatchSos(baseInput({ emergencyContacts: [], adminFcmTokens: [] }));

    expect(result).toEqual({ policeNotified: false, contactsNotified: 0, adminAlerted: 0 });
    expect(mockedSendSms).not.toHaveBeenCalled();
    expect(mockedSendPush).not.toHaveBeenCalled();
  });
});
