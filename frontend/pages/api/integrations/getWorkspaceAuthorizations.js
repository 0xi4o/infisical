import { PATH } from "~/const";
import SecurityClient from "~/utilities/SecurityClient";

/**
 * This route gets authorizations of a certain project (Heroku, etc.)
 * @param {*} workspaceId
 * @returns
 */
const getWorkspaceAuthorizations = ({ workspaceId }) => {
  return SecurityClient.fetchCall(
    PATH + "/api/v1/workspace/" + workspaceId + "/authorizations",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).then(async (res) => {
    if (res.status == 200) {
      return (await res.json()).authorizations;
    } else {
      console.log("Failed to get project authorizations");
    }
  });
};

export default getWorkspaceAuthorizations;
