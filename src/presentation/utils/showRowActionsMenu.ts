import { ActionSheetIOS, Alert, Platform } from 'react-native';

/**
 * Opens a compact actions menu for a list row (⋯ → Delete).
 * iOS uses ActionSheet; Android and web use Alert action buttons.
 */
export function showRowActionsMenu(options: {
  title?: string;
  deleteLabel?: string;
  onDelete: () => void;
}): void {
  const { title = 'Actions', deleteLabel = 'Delete', onDelete } = options;

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', deleteLabel],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 0,
        title,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) onDelete();
      }
    );
    return;
  }

  Alert.alert(title, undefined, [
    { text: 'Cancel', style: 'cancel' },
    { text: deleteLabel, style: 'destructive', onPress: onDelete },
  ]);
}
