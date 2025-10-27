
declare global {
	//ajouter la propriete updateFriendsStatus a Window
	interface Window {
		updateFriendStatus: (userId: number, status: number) => void;
	}
}

export {};
