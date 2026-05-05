import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Generated from Firebase project `victoria-place-portal` (matches `google-services.json` + web app).
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        throw UnsupportedError(
          'Add iOS Firebase (GoogleService-Info.plist / flutterfire) before running on iOS.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been defined for ${defaultTargetPlatform.name}.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyD7qMZSH6mq4kqm9bDSi6TerqpxuA_QUP0',
    appId: '1:408199402074:android:c3901c81d9be7fc69f7e63',
    messagingSenderId: '408199402074',
    projectId: 'victoria-place-portal',
    databaseURL: 'https://victoria-place-portal-default-rtdb.firebaseio.com',
    storageBucket: 'victoria-place-portal.firebasestorage.app',
  );

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyB6bV9d5y8-xULPuH1JbTWB8QW8xnltMIY',
    appId: '1:408199402074:web:3b79ad379455b92f9f7e63',
    messagingSenderId: '408199402074',
    projectId: 'victoria-place-portal',
    authDomain: 'victoria-place-portal.firebaseapp.com',
    storageBucket: 'victoria-place-portal.firebasestorage.app',
    measurementId: 'G-GZEEWPX9ET',
  );
}
