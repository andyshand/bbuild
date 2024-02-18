export function getLatestValue(subject) {
  // Access the latest value without subscription
  let latestValue;
  subject.subscribe((value) => {
    latestValue = value;
  }).unsubscribe(); // Unsubscribe immediately after receiving the latest value

  return latestValue;
}
