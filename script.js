// FIRST COUNTDOWN - Draft Day
// The format "YYYY-MM-DDTHH:mm:ss-06:00" specifies the Mountain Daylight Time (UTC-6) offset
const countDownDate = new Date("2025-10-06T01:00:00Z").getTime();

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
        document.getElementById("countdown").innerHTML = "IT'S DRAFTING TIME!";
    }
}, 1000);


// SECOND COUNTDOWN - Draft Order Reveal
// Oct 4, 4PM PST = Oct 5, 00:00 UTC
const draftOrderCountDownDate = new Date("2025-10-05T00:00:00Z").getTime();

// Update the draft order countdown every 1 second
const y = setInterval(function() {
    const now = new Date().getTime();
    const distance = draftOrderCountDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Pad numbers with a leading zero if they are less than 10
    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = seconds.toString().padStart(2, '0');

    // Display the result in the element with id="draft-order-countdown"
    document.getElementById("draft-order-countdown").innerHTML = days + ":" + paddedHours + ":" + paddedMinutes + ":" + paddedSeconds;

    // If the count down is finished, show a link to the draft order page
    if (distance < 0) {
        clearInterval(y);
        document.getElementById("draft-order-countdown").innerHTML = '<a href="draft-order.html" class="target-list">VIEW DRAFT ORDER</a>';
    }
}, 1000);