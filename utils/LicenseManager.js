const axios = require('axios');

class LicenseManager {
    constructor(baseUrl, clientId) {
        this.baseUrl = baseUrl;
        this.clientId = clientId;
    }

    /**
     * Verifies the license key with the remote server.
     * @param {string} licenseKey The license key to verify.
     * @returns {Promise<{success: boolean, message: string}>} The verification result.
     */
    async verifyLicense(licenseKey) {
        // Ensure essential configuration is present
        if (!licenseKey || !this.clientId || !this.baseUrl) {
            return { success: false, message: 'License key, client ID, or API URL is not configured.' };
        }

        try {
            // Make the POST request to the verification endpoint
            const response = await axios.post(`${this.baseUrl}/api/v1/license/verify`, {
                licenseKey: licenseKey,
                clientId: this.clientId
            });
            return response.data; // The API response { success, message, data }
        } catch (error) {
            // Handle cases where the request fails (e.g., network error, server error)
            const errorMessage = error.response?.data?.message || 'Verification failed due to a network or server error.';
            return { success: false, message: errorMessage };
        }
    }

    /**
     * Performs a periodic license check
     * @param {number} interval Interval in milliseconds (default: 24 hours)
     * @param {string} licenseKey The license key to verify
     * @param {Function} onInvalid Callback function when license becomes invalid
     */
    startPeriodicCheck(licenseKey, interval = 24 * 60 * 60 * 1000, onInvalid) {
        setInterval(async () => {
            const result = await this.verifyLicense(licenseKey);
            if (!result.success && typeof onInvalid === 'function') {
                onInvalid(result.message);
            }
        }, interval);
    }
}

module.exports = LicenseManager;