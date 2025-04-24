# RoadwayTag
A lightweight JavaScript utility that automatically tracks HubSpot form submissions in Google Analytics 4.

## Installation
Add the following script tag to the `<head>` section of your website:
```html
<script defer="" src="//analytics.roadwayai.com/tag.js"></script>
```

## Features:
* Automatic Form Tracking: Captures all HubSpot form submissions
* Cross-Platform User Identification: Correlates users between GA4 and HubSpot
* Fallback Mechanisms: Uses dataLayer if gtag is unavailable

## How It Works
The script performs these key functions:
* Identifies users by extracting GA4 pseudo IDs and HubSpot UTK cookies
* Ensures proper GA4 configuration before sending events
* Adds event listeners to monitor HubSpot form submission events
* Sends Hubspot form submission data to GA4 with appropriate parameters via GTAG

## Requirements
* Google Analytics 4 configured on your website
* HubSpot forms implementation

## Debugging
Enable debug logging by adding this before the script tag:
```html
<script> window.ROADWAY_DEBUG = true; </script>
```

## Support
For issues or questions, please open an issue in this 
