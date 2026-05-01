import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { Request, Response } from "express";
import type { ClientDetailsFormData } from "#src/adaptors/presenters/apply/models/form.types.js";
import { MAX_CHARACTER_LENGTH } from "#src/infrastructure/locales/constants.js";

export class ClientDetailsAdaptor {
  renderNameForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/client-details/name-and-dob", { csrfToken });
  }

  processNameForm(
    req: TypedRequestBody<Partial<ClientDetailsFormData>>,
    res: Response,
  ): void {
    const {
      body: {
        "first-name": firstName,
        "last-name": lastName,
        "last-name-at-birth": lastNameAtBirth,
        // "name-change": hasNameChanged
      },
    } = req;
    console.log(req.body, "<------- req body");
    const {
      locals: { csrfToken },
    } = res;

    if (typeof firstName === "string" && firstName === "") {
      res.render("apply/client-details/name-and-dob", {
        csrfToken,
        errorMessage: { text: "Please enter your client's first name" },
      });
    } else if (
      typeof firstName === "string" &&
      firstName.length > MAX_CHARACTER_LENGTH
    ) {
      const characterLimitErrorMessage =
        "First name(s) cannot exceed 100 characters";
      res.render("apply/client-details/name-and-dob", {
        csrfToken,
        errorMessage: { text: characterLimitErrorMessage },
      });
    } else if (typeof lastName === "string" && lastName === "") {
      res.render("apply/client-details/name-and-dob", {
        csrfToken,
        errorMessage: { text: "Please enter your client's last name" },
      });
    } else if (
      typeof lastName === "string" &&
      lastName.length > MAX_CHARACTER_LENGTH
    ) {
      const characterLimitErrorMessage =
        "Last name cannot exceed 100 characters";
      res.render("apply/client-details/name-and-dob", {
        csrfToken,
        errorMessage: { text: characterLimitErrorMessage },
      });
    }
    // else if (hasNameChanged === undefined) {
    //   const noRadioSelectedErrorMessage =
    //     "Please select an option";
    //   res.render("apply/client-details/name-and-dob", {
    //     csrfToken,
    //     errorMessage: { text: noRadioSelectedErrorMessage },
    //   });
    // }
    else {
      req.session.clientFirstName = firstName;
      req.session.clientLastName = lastName;
      req.session.clientLastNameAtBirth = lastNameAtBirth;
      res.redirect("/apply/client-details/nino");
    }
  }

  renderNinoForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    res.render("apply/client-details/nino", { csrfToken });
  }

  processNinoForm(
    req: TypedRequestBody<Partial<ClientDetailsFormData>>,
    res: Response,
  ): void {
    const {
      body: { "has-nino": hasNino, "nino-input": ninoInput },
    } = req;
    req.session.clientNino = hasNino === "true" ? ninoInput : null;
    res.redirect("/apply/client-details/has-prev-application");
  }

  renderHasPrevApplicationForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    res.render("apply/client-details/has-prev-application", { csrfToken });
  }

  processHasPrevApplicationForm(
    req: TypedRequestBody<Partial<ClientDetailsFormData>>,
    res: Response,
  ): void {
    const {
      body: {
        "has-prev-application": hasPrevApplication,
        "prev-laa-reference-input": prevLaaReferenceInput,
      },
    } = req;
    req.session.clientHasPrevApplication = hasPrevApplication === "true";
    req.session.prevLaaReferenceInput =
      hasPrevApplication === "true" ? prevLaaReferenceInput : null;
    res.redirect("/apply/proceedings");
  }
}
