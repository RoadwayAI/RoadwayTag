(function () {
  function debugLog(message, error = null) {
    const url = new URL(window.location.href);
    
    if (!url.searchParams.has("roadway_debug")) return;

    if (error) {
      console.error(`[Roadway Tag] ${message}`, error);
    } else {
      console.log(`[Roadway Tag] ${message}`);
    }
  }

  function initializeSegmentAnonymousIdFillerJob() {
    const segmentAnonymousIdFieldNames = ["segment_anon_id", "segment_anon_id__c"];
    
    return runIndefinitely(() => {
      debugLog("Attempting to set Segment anonymous ID");
      const segmentAnonymousId = getSegmentAnonymousId();
      if (!segmentAnonymousId) return false;

      const formFields = segmentAnonymousIdFieldNames
        .map((fieldName) => document.querySelector(`input[name="${fieldName}"]`))
        .filter(Boolean);

      if (segmentAnonymousId && formFields.length > 0) {
        formFields.forEach((field) => {
          field.value = segmentAnonymousId;
        });
        debugLog("Segment anonymous ID set successfully");
        return true;
      }

      debugLog("Segment anonymous ID not found");
      return false;
    }, "set Segment anonymous ID");
  }

  function initializeHubspotFormPseudoIdFillerJob() {
    return runIndefinitely(() => {
      const ga4PseudoIdInputFieldNames = [
        "ga4_pseudo_user_id",
        "user_pseudo_id",
        "pseudo_user_id",
      ];

      const ga4PseudoId = getUserPseudoId();
      const formFields = ga4PseudoIdInputFieldNames
        .map((fieldName) =>
          document.querySelector(`input[name="${fieldName}"]`),
        )
        .filter(Boolean);
      if (ga4PseudoId && formFields.length > 0) {
        formFields.forEach((field) => {
          if (!field.value) {
            field.value = ga4PseudoId;
          }
        });
        return true;
      }
      return false;
    }, "set GA4 pseudo ID");
  }

  function getSegmentAnonymousId() {
    return window.analytics?.user?.()?.anonymousId?.();
  }

  function getUserPseudoId() {
    debugLog("Attempting to get user pseudo ID");
    try {
      if (!document.cookie) {
        debugLog("No cookies found");
        return null;
      }
      // Split by semicolon and trim each cookie to handle cases with or without spaces
      const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
      const gaCookie = cookies.find(
        (row) => row.startsWith("_ga=") && !row.includes("_gat"),
      );
      if (!gaCookie) {
        debugLog("No _ga cookie found");
        return null;
      }
      const pseudoId = gaCookie.split("=")[1].split(".").slice(-2).join(".");
      debugLog(`Found pseudo ID: ${pseudoId}`);
      return pseudoId;
    } catch (error) {
      debugLog("Error retrieving user pseudo ID:", error);
      return null;
    }
  }
  function runIndefinitely(operation, name, interval = 1500) {
    setInterval(function () {
      debugLog(`Attempting ${name}`);
      try {
        operation();
      } catch (error) {
        debugLog(`Error in ${name}:`, error);
      }
    }, interval);
  }

  function validateGa4Configuration() {
    if (typeof window.gtag === "function" && window.dataLayer) {
      const ga4Config = window.dataLayer.find(
        (entry) => entry[0] === "config" && entry[1]?.startsWith("G-"),
      );
      if (ga4Config) {
        debugLog(
          `GA4 is properly configured with Measurement ID: ${ga4Config[1]}`,
        );
        return true;
      } else {
        debugLog(
          "GA4 is NOT properly configured. No valid Measurement ID found.",
        );
        return false;
      }
    }
    debugLog("GA4 is NOT properly configured. gtag or dataLayer is missing");
    return false;
  }

  function getHubspotUtkCookie() {
    try {
      const cookies = document.cookie.split(";");
      const cookieName = "hubspotutk=";

      for (let cookie of cookies) {
        try {
          cookie = cookie.trim();
          if (cookie.indexOf(cookieName) === 0) {
            return cookie.substring(cookieName.length).replace(/[^\w-]/g, "");
          }
        } catch (innerError) {
          debugLog("Error processing individual cookie", innerError);
          continue;
        }
      }
      return null;
    } catch (error) {
      debugLog("Error accessing or parsing cookies", error);
      return null;
    }
  }

  function getHubspotFormSubmissionParameters(event) {
    // Check if hostname contains canibuild.com (works for subdomains too)
    // for canibuild, we have to use the hubspot_form_id as the utk cookie value
    const isCanibuild = window.location.hostname.includes("canibuild.com");

    if (isCanibuild) {
      return {
        hubspot_form_id: getHubspotUtkCookie(),
      };
    } else {
      return {
        hubspot_form_id: event?.data?.id,
        hubspot_utk: getHubspotUtkCookie(),
      };
    }
  }

  function triggerGa4EventForHubspotFormSubmission(eventData) {
    if (validateGa4Configuration()) {
      debugLog("Sending event via gtag");
      window.gtag("event", "hubspot_form_submission", eventData);
    } else {
      debugLog("gtag not available, falling back to dataLayer");
      // If gtag isn't available, we can fallback to pushing the event into the dataLayer
      // This requires that you have Google Tag Manager set up to handle 'hubspot_form_submission' events
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "hubspot_form_submission",
        ...eventData,
      });
    }
  }

  function initializeHubspotFormSubmissionListener() {
    window.addEventListener("message", function (event) {
      if (
        event.data?.type === "hsFormCallback" &&
        event.data.eventName === "onFormSubmit"
      ) {
        debugLog("onFormSubmit callback received. Event: ", event);

        const eventData = getHubspotFormSubmissionParameters(event);
        debugLog("Event data prepared:", eventData);

        triggerGa4EventForHubspotFormSubmission(eventData);
      }
    });
  }

  function initializeHubspotListenerForAnyFormSubmission() {
    window.addEventListener("submit", function (event) {
      try {
        debugLog("Form submitted:", event);
        const eventData = getHubspotFormSubmissionParameters(event);
        debugLog("Event Data:", eventData);

        triggerGa4EventForHubspotFormSubmission(eventData);
      } catch (error) {
        debugLog("Error in submit event listener:", error);
      }
    });
  }

  async function main() {
    debugLog("Starting main execution");
    initializeHubspotFormSubmissionListener();
    initializeHubspotFormPseudoIdFillerJob();
    initializeSegmentAnonymousIdFillerJob();
    initializeHubspotListenerForAnyFormSubmission();

    setTimeout(() => {
      // if debug is enabled, this is good for us to check if ga4 is configured
      validateGa4Configuration();
    }, 5000);
  }

  function initializeRoadwayTag() {
    // Handle initial page load
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", main);
    } else {
      main();
    }
  }

  initializeRoadwayTag();
})();
