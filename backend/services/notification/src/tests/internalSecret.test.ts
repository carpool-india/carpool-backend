import type { Request, Response } from "express";
import { createRequireInternalSecret } from "../middleware/internalSecret";

function mockReqRes(headerValue?: string) {
  const req = {
    header: jest.fn().mockReturnValue(headerValue),
  } as unknown as Request;
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status } as unknown as Response;
  const next = jest.fn();
  return { req, res, next, status, json };
}

describe("requireInternalSecret", () => {
  it("passes through when no secret is configured (dev mode)", () => {
    const middleware = createRequireInternalSecret(undefined);
    const { req, res, next, status } = mockReqRes(undefined);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });

  it("passes through when configured and the correct header is present", () => {
    const middleware = createRequireInternalSecret("super-secret");
    const { req, res, next, status } = mockReqRes("super-secret");

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });

  it("rejects with 401 when the header is missing and a secret is configured", () => {
    const middleware = createRequireInternalSecret("super-secret");
    const { req, res, next, status, json } = mockReqRes(undefined);

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      error: "unauthorized",
      message: "Missing or invalid internal service credential",
    });
  });

  it("rejects with 401 when the header is present but wrong", () => {
    const middleware = createRequireInternalSecret("super-secret");
    const { req, res, next, status, json } = mockReqRes("wrong-value");

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      error: "unauthorized",
      message: "Missing or invalid internal service credential",
    });
  });
});
