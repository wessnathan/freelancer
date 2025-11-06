import { useAuthStore } from "~/store/auth";
import { useAppStore } from "~/store/app";

export function useGoogleAuth(mode: "login" | "register", userType?: "client" | "freelancer") {
    const authStore = useAuthStore();
    const appStore = useAppStore();

    async function handleGoogleResponse(response: any) {
        console.log("Google callback response:", response);
        const id_token = response?.credential;
        const user_type = userType;

        if (!id_token) {
            console.error("No id_token received from Google");
            appStore.showSnackBar({
                message: "Google did not return a token. Please try again.",
                type: "error",
            });
            return;
        }

        try {
            let res;
            if (mode === "register") {
                // registration requires both token + user_type
                res = await authStore.googleLogin(id_token, user_type);
            } else {
                // login requires only the token
                res = await authStore.googleLogin(id_token);
            }

            appStore.showSnackBar({
                message: `Signed ${mode === "login" ? "in" : "up"} with Google successfully!`,
                type: "success",
            });

            // Redirect based on user type
            const finalType =
                res?.user?.user_type || user_type || "client";

            navigateTo(
                finalType === "client"
                    ? "/client/dashboard"
                    : "/freelancer/dashboard"
            );
        } catch (err: any) {
            console.error("Google auth failed:", err);
            const backendErrMsg =
                err?.response?._data?.error ||
                err?.response?._data?.detail ||
                "Google authentication failed. Please try again.";

            appStore.showSnackBar({
                message: backendErrMsg,
                type: "error",
            });
        }
    }

    function renderGoogleButton(targetId: string) {
        const config = useRuntimeConfig();
        const clientId =
            config?.public?.googleClientId ||
            (import.meta as any).env?.NUXT_GOOGLE_CLIENT_ID;

        if (!clientId) {
            console.error(
                "Missing Google client ID."
            );
            return;
        }

        if (!window.google?.accounts?.id) {
            console.error(
                "Google Identity Services SDK not available. "
            );
            return;
        }

        // Initialize Google button
        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
        });

        const target = document.getElementById(targetId);
        if (!target) {
            console.error(`Google button element with id "${targetId}" not found.`);
            return;
        }

        
        window.google.accounts.id.renderButton(target, {
            theme: "outline",        
            size: "large",
            text: mode === "login" ? "signin_with" : "signup_with",
            shape: "rectangular",
            width: "100%", 
            logo_alignment: "left",
        });

    }

    return { renderGoogleButton };
}
