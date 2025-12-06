import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

export class GoogleOAuth {
	private static instance: GoogleOAuth
	private oauth2Client: OAuth2Client

	constructor() {
		this.oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_AUTH_CLIENT_ID,
			process.env.GOOGLE_AUTH_CLIENT_SECRET,
			process.env.GOOGLE_AUTH_REDIRECT_URI,
		)
	}

	public static getInstance(): GoogleOAuth {
		if (!GoogleOAuth.instance) {
			GoogleOAuth.instance = new GoogleOAuth()
		}
		return GoogleOAuth.instance
	}

	public getOAuth2Client(): OAuth2Client {
		return this.oauth2Client
	}
}

export const googleOAuth = GoogleOAuth.getInstance().getOAuth2Client()
