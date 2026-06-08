export class CorrespondenceRecipient {
  recipientType: "PERSON" | "ORGANISATION";
  recipientName: string;

  constructor(recipientType: "PERSON" | "ORGANISATION", recipientName: string) {
    this.recipientType = recipientType;
    this.recipientName = recipientName;
  }
}
