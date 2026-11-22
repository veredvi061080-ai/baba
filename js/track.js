// Loads Meta Pixel and GA4 only when their IDs are set in js/config.js,
// and exposes babaTrack(event, params) so pages send one event to both.
(function () {
  var c = window.BABA_CONFIG || {};
  if (c.metaPixelId) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', c.metaPixelId);
    fbq('track', 'PageView');
  }
  if (c.ga4Id) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(c.ga4Id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', c.ga4Id);
  }
  // Meta standard event name -> GA4 recommended event name
  var GA = { ViewContent: 'view_item', InitiateCheckout: 'begin_checkout', AddPaymentInfo: 'add_payment_info', Lead: 'generate_lead', Purchase: 'purchase', Contact: 'contact' };
  window.babaTrack = function (event, p) {
    p = p || {};
    try { if (window.fbq) fbq('track', event, p, p.eventID ? { eventID: p.eventID } : undefined); } catch (e) {}
    try {
      if (window.gtag && c.ga4Id) {
        var g = { currency: p.currency, value: p.value, transaction_id: p.order_id };
        if (p.content_name) g.items = [{ item_name: p.content_name, quantity: p.num_items || 1, price: c.price }];
        gtag('event', GA[event] || event, g);
      }
    } catch (e) {}
  };
})();
