import { exec, css } from "@gatling.io/core";
import type { ChainBuilder } from "@gatling.io/core";
import { http, status, StringBodyPart, RawFileBodyPart } from "@gatling.io/http";

const csrfCheck = css("input[name=_csrf]", "value").saveAs("csrfToken");

export const getCoronersLetter: ChainBuilder = exec(
  http("GET upload coroners letter")
    .get("/apply/upload-coroners-letter")
    .check(status().is(200))
    .check(csrfCheck),
);

// multer expects the file under the "documents" field (see app.ts), and CSRF
// validation runs after multer parses the body, so _csrf must be a body part
// too — form params can't be mixed with a multipart body.
export const uploadCoronersLetter: ChainBuilder = exec(
  http("POST upload coroners letter file")
    .post("/apply/upload-coroners-letter/upload")
    .asMultipartForm()
    .bodyParts(
      StringBodyPart("_csrf", "#{csrfToken}"),
      StringBodyPart("uploadMode", "html"),
      RawFileBodyPart("documents", "test-coroners-letter.png").contentType(
        "image/png",
      ),
    )
    .disableFollowRedirect()
    .check(status().is(302)),
);

export const continueCoronersLetter: ChainBuilder = exec(
  http("POST continue coroners letter")
    .post("/apply/upload-coroners-letter")
    .formParam("_csrf", "#{csrfToken}")
    .disableFollowRedirect()
    .check(status().is(302)),
);
