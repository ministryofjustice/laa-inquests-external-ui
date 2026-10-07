export interface ApplicationDeclarationError {
  noDeclarationConfirmation: {
    text: string;
  };
}

export interface ApplicationDeclarationFormData {
  _csrf: string;
  "application-declaration-confirmation"?: string;
}
