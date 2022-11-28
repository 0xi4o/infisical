import { PATH } from "~/const";
import SecurityClient from "~/utilities/SecurityClient";

/**
 * This route add an incident contact email to a certain organization
 * @param {*} param0
 * @returns
 */
const addIncidentContact = (organizationId, email) => {
  return SecurityClient.fetchCall(
    PATH + "/api/v1/organization/" + organizationId + "/incidentContactOrg",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
      }),
    }
  ).then(async (res) => {
    if (res.status == 200) {
      return res;
    } else {
      console.log("Failed to add an incident contact");
    }
  });
};

export default addIncidentContact;
