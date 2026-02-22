interface GoogleTokenResponse {
    access_token: string;
    error?: string;
    error_description?: string;
}

interface GoogleTokenClient {
    requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface Window {
    google: {
        accounts: {
            oauth2: {
                initTokenClient: (config: {
                    client_id: string;
                    scope: string;
                    callback: (response: GoogleTokenResponse) => void;
                }) => GoogleTokenClient;
                revoke: (token: string, done: () => void) => void;
            };
        };
    };
}
