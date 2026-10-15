export class NativeEventEmitter {
  addListener() {
    return { remove() {} };
  }

  removeAllListeners() {}

  removeSubscription() {}

  emit() {}
}

export default NativeEventEmitter;
