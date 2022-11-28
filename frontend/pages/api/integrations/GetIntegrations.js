import { PATH } from "~/const";
import SecurityClient from "~/utilities/SecurityClient";

const getIntegrations = () => {
  return SecurityClient.fetchCall(PATH + "/api/v1/integration/integrations", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then(async (res) => {
    if (res.status == 200) {
      return (await res.json()).integrations;
    } else {
      console.log("Failed to get project integrations");
    }
  });
};

export default getIntegrations;
