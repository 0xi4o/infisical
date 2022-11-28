import { PATH } from "~/const";
import SecurityClient from "~/utilities/SecurityClient.js";

/**
 * This function is used to check if the user is authenticated.
 * To do that, we get their tokens from cookies, and verify if they are good.
 * @param {*} req
 * @param {*} res
 * @returns
 */
const checkAuth = async (req, res) => {
  return SecurityClient.fetchCall(PATH + "/api/v1/auth/checkAuth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => {
    if (res.status == 200) {
      return res;
    } else {
      console.log("Not authorized");
    }
  });
};

export default checkAuth;
