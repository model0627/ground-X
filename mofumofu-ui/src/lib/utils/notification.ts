import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { goto } from '$app/navigation';

export interface DeviceNotificationData {
	deviceId: string;
	deviceName: string;
	deviceType?: string;
}

/**
 * 알림 권한을 요청하고 확인합니다
 */
export async function ensureNotificationPermission(): Promise<boolean> {
	try {
		console.log('🔔 Checking notification permission...');
		let permissionGranted = await isPermissionGranted();
		console.log('🔔 Permission granted:', permissionGranted);

		if (!permissionGranted) {
			console.log('🔔 Requesting permission...');
			const permission = await requestPermission();
			permissionGranted = permission === 'granted';
			console.log('🔔 Permission result:', permission);
		}

		return permissionGranted;
	} catch (error) {
		console.error('❌ Failed to check notification permission:', error);
		return false;
	}
}

/**
 * 디바이스 추가 알림을 보냅니다
 */
export async function sendDeviceAddedNotification(data: DeviceNotificationData): Promise<void> {
	console.log('📱 sendDeviceAddedNotification called with:', data);

	const hasPermission = await ensureNotificationPermission();
	console.log('📱 Has permission:', hasPermission);

	if (!hasPermission) {
		console.warn('⚠️ Notification permission not granted');
		return;
	}

	try {
		console.log('📱 Sending notification...');

		const notificationPayload = {
			title: '새 디바이스 추가됨',
			body: `${data.deviceName}${data.deviceType ? ` (${data.deviceType})` : ''} 디바이스가 추가되었습니다.`,
			icon: null,
		};
		console.log('📱 Notification payload:', notificationPayload);

		// localStorage에 마지막 알림 정보 저장 (알림 클릭 시 페이지 이동에 사용)
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('lastDeviceNotification', JSON.stringify({
				deviceId: data.deviceId,
				deviceName: data.deviceName,
				timestamp: Date.now()
			}));
		}

		await sendNotification(notificationPayload);

		console.log('✅ Device notification sent:', data.deviceName);
	} catch (error) {
		console.error('❌ Failed to send notification:', error);
		console.error('Error details:', error);
		throw error;
	}
}

/**
 * 디바이스 상세 페이지로 이동합니다
 */
export function navigateToDeviceDetail(deviceId: string): void {
	goto(`/ipam/device/${deviceId}`);
}

/**
 * 알림을 클릭했을 때 디바이스 상세 페이지로 이동합니다
 */
export async function handleDeviceNotificationClick(deviceId: string): Promise<void> {
	navigateToDeviceDetail(deviceId);
}
