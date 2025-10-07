import { privateApi } from '../private';
import { publicApi } from '../public';
import type {
	GithubAuthRequest,
	GoogleAuthRequest,
	RefreshAccessTokenResponse,
	SignupRequest,
	VerifyEmailRequest,
	SigninRequest,
	ForgotPasswordRequest,
	ResetPasswordRequest,
	ResendVerificationRequest,
	SetPasswordRequest,
	OAuthConnectionsResponse,
	UnlinkOAuthRequest,
	LinkOAuthRequest
} from './types';

// refreshAccessToken 수정
export async function refreshAccessToken(): Promise<RefreshAccessTokenResponse> {
	try {
		const response = await publicApi.post('v0/auth/refresh', {});

		// 204 No Content 처리
		if (response.status === 204 || !response.headers.get('content-type')?.includes('application/json')) {
			// 빈 응답이면 refresh token 자체가 만료되었음을 의미
			throw new Error('Refresh token expired or invalid');
		}

		const data = await response.json<RefreshAccessTokenResponse>();
		return data;
	} catch (error) {
		console.error('Failed to refresh access token:', error);
		// 더 자세한 에러 정보 로깅
		if (error instanceof Error) {
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}
		throw error;
	}
}

export async function signOut(): Promise<void> {
	try {
		await privateApi.post('v0/auth/sign_out', {});
	} catch (error) {
		console.error('Failed to sign out:', error);
		throw error;
	}
}

export async function googleAuth(code: string, handle?: string): Promise<RefreshAccessTokenResponse> {
	const payload: GoogleAuthRequest = { code, handle };
	return privateApi.post('v0/auth/google', { json: payload }).json<RefreshAccessTokenResponse>();
}

export async function githubAuth(code: string, handle?: string): Promise<RefreshAccessTokenResponse> {
	const payload: GithubAuthRequest = { code, handle };
	return privateApi.post('v0/auth/github', { json: payload }).json<RefreshAccessTokenResponse>();
}

export async function signup(data: SignupRequest): Promise<RefreshAccessTokenResponse> {
	return publicApi.post('v0/auth/sign_up', { json: data }).json<RefreshAccessTokenResponse>();
}

export async function verifyEmail(token: string): Promise<void> {
	const payload: VerifyEmailRequest = { token };
	return publicApi.post('v0/auth/verify_email', { json: payload }).then(() => {});
}

export async function signin(handle: string, password: string): Promise<RefreshAccessTokenResponse> {
	const payload: SigninRequest = { handle, password };
	return publicApi.post('v0/auth/sign_in', { json: payload }).json<RefreshAccessTokenResponse>();
}

export async function forgotPassword(email: string): Promise<void> {
	const payload: ForgotPasswordRequest = { email };
	return publicApi.post('v0/auth/forgot_password', { json: payload }).then(() => {});
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
	const payload: ResetPasswordRequest = { token, new_password: newPassword };
	return publicApi.post('v0/auth/reset_password', { json: payload }).then(() => {});
}

export async function resendVerification(email: string): Promise<void> {
	const payload: ResendVerificationRequest = { email };
	return publicApi.post('v0/auth/resend_verification', { json: payload }).then(() => {});
}

export async function setPassword(password: string): Promise<void> {
	const payload: SetPasswordRequest = { password };
	return privateApi.post('v0/auth/set_password', { json: payload }).then(() => {});
}

export async function getOAuthConnections(): Promise<OAuthConnectionsResponse> {
	return privateApi.get('v0/auth/oauth-connections').json<OAuthConnectionsResponse>();
}

export async function unlinkOAuth(provider: 'Google' | 'Github'): Promise<void> {
	const payload: UnlinkOAuthRequest = { provider };
	return privateApi.delete('v0/auth/unlink-oauth', { json: payload }).then(() => {});
}

export async function linkOAuth(provider: 'Google' | 'Github', code: string): Promise<void> {
	const payload: LinkOAuthRequest = { provider, code };
	return privateApi.post('v0/auth/link_oauth', { json: payload }).then(() => {});
}
