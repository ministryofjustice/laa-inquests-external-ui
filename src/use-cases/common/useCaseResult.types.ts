export type TechnicalFailureReason =
  | "INVALID_INPUT_STATE"
  | "INVALID_RESPONSE"
  | "UNEXPECTED_EXCEPTION"
  | "UPSTREAM_REJECTED";

export type UseCaseResult<Data = undefined, ValidationErrors = undefined> =
  | {
      status: "SUCCESS";
      data?: Data;
    }
  | {
      status: "VALIDATION_FAILED";
      errorSummaries: ValidationErrors;
    }
  | {
      status: "TECHNICAL_FAILURE";
      reason: TechnicalFailureReason;
    };
