export interface ClaimDeclarationError {
  noDeclarationConfirmation: {
    text: string;
  };
}

export interface ClaimDeclarationFormData {
  _csrf: string;
  "claim-declaration-confirmation"?: string;
}
