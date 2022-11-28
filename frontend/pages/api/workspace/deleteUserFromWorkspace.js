import { PATH } from "~/const";
import SecurityClient from "~/utilities/SecurityClient";

/**
 * This function removes a certain member from a certain workspace
 * @param {*} membershipId
 * @returns
 */
const deleteUserFromWorkspace = (membershipId) => {
  return SecurityClient.fetchCall(PATH + "/api/v1/membership/" + membershipId, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  }).then(async (res) => {
    if (res.status == 200) {
      return res;
    } else {
      console.log("Failed to delete a user from a project");
    }
  });
};

export default deleteUserFromWorkspace;
