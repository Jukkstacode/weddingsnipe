// Set the date we're counting down to: Aug 31, 2025 7:30 PM MDT
// The format "YYYY-MM-DDTHH:mm:ss-06:00" specifies the Mountain Daylight Time (UTC-6) offset
const countDownDate = new Date("2025-08-31T19:30:00-06:00").getTime();

// Update the count down every 1 second
const x = setInterval(function() {
    const now = new Date().getTime();
    const distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Pad numbers with a leading zero if they are less than 10
    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = seconds.toString().padStart(2, '0');

    // Display the result in the element with id="countdown"
    document.getElementById("countdown").innerHTML = days + ":" + paddedHours + ":" + paddedMinutes + ":" + paddedSeconds;

    // If the count down is finished, write some text
    if (distance < 0) {
        clearInterval(x);
        document.getElementById("countdown").innerHTML = "COUNTDOWN FINISHED";
    }
}, 1000);