import { PATH } from "~/const";

/**
 * This function is called in the end of the signup process.
 * It sends all the necessary nformation to the server.
 * @param {*} email
 * @param {*} firstName
 * @param {*} lastName
 * @param {*} publicKey
 * @param {*} ciphertext
 * @param {*} iv
 * @param {*} tag
 * @param {*} salt
 * @param {*} verifier
 * @returns
 */
const completeAccountInformationSignupInvite = ({
  email,
  firstName,
  lastName,
  publicKey,
  ciphertext,
  iv,
  tag,
  salt,
  verifier,
  token,
}) => {
  return fetch(PATH + "/api/v1/signup/complete-account/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      email: email,
      firstName: firstName,
      lastName: lastName,
      publicKey: publicKey,
      encryptedPrivateKey: ciphertext,
      iv: iv,
      tag: tag,
      salt: salt,
      verifier: verifier,
    }),
  });
};

export default completeAccountInformationSignupInvite;
