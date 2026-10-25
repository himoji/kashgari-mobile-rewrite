import { Platform, Share } from 'react-native';

/** Web downloads the file; native opens the share sheet with its text (mail, messengers, Files). */
export async function shareTextFile(name: string, text: string, type = 'text/csv') {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob(['﻿' + text], { type: `${type};charset=utf-8` }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: name, message: text });
}
