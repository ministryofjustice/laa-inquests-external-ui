export type UseCaseResult<Data = undefined, ValidationErrors = undefined> =
  | {
      status: "SUCCESS";
      data?: Data;
    }
  | {
      status: "VALIDATION_FAILED";
      errorSummaries: ValidationErrors;
    };
