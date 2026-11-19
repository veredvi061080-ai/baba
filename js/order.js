// Order form: step 1 shipping details, step 2 payment, then the order goes to WhatsApp
// and the buyer lands on /order/thanks/. No server: WhatsApp is the order record.
(function () {
  var c = window.BABA_CONFIG, $ = function (id) { return document.getElementById(id); };
  var form = $('orderForm'), step2 = $('orderPay');
  if (!form) return;
  var track = window.babaTrack || function () {};
  var qty = $('oQty'), started = false, order = null;

  function total() { return c.price * Number(qty.value) + (c.shipping || 0); }
  function render() {
    $('oTotal').textContent = total().toLocaleString('he-IL') + ' ₪';
    $('oShip').textContent = c.shipping == null ? '' : (c.shipping ? 'כולל משלוח ' + c.shipping + ' ₪' : 'כולל משלוח');
  }
  $('oMinus').onclick = function () { qty.value = Math.max(1, Number(qty.value) - 1); render(); };
  $('oPlus').onclick = function () { qty.value = Math.min(c.maxQty, Number(qty.value) + 1); render(); };
  form.addEventListener('input', function () {
    if (!started) { started = true; track('InitiateCheckout', { currency: 'ILS', value: total(), num_items: Number(qty.value), content_name: 'חפיסת באבא' }); }
  });

  var phoneOk = function (v) { return /^0(5\d|[2-489]|7\d)\d{7}$/.test(v.replace(/[\s-]/g, '')); };
  function err(el, msg) {
    var box = el.closest('.f'); box.classList.toggle('bad', !!msg);
    box.querySelector('.msg').textContent = msg || '';
    return !msg;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true, f = form.elements;
    ok = err(f.name, f.name.value.trim().length < 2 ? 'נא למלא שם מלא' : '') && ok;
    ok = err(f.phone, phoneOk(f.phone.value) ? '' : 'מספר טלפון לא תקין') && ok;
    ok = err(f.email, !f.email.value || /^\S+@\S+\.\S+$/.test(f.email.value) ? '' : 'כתובת מייל לא תקינה') && ok;
    ok = err(f.city, f.city.value.trim() ? '' : 'נא למלא עיר') && ok;
    ok = err(f.street, f.street.value.trim() ? '' : 'נא למלא רחוב ומספר בית') && ok;
    if (!ok) { form.querySelector('.bad input').focus(); return; }

    var d = new Date();
    order = {
      id: 'BABA-' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
      qty: Number(qty.value), total: total(),
      name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(),
      city: f.city.value.trim(), street: f.street.value.trim(), apt: f.apt.value.trim(), notes: f.notes.value.trim()
    };
    try { sessionStorage.setItem('babaOrder', JSON.stringify(order)); } catch (x) {}

    $('pId').textContent = order.id;
    $('pSum').textContent = order.qty + ' × חפיסת באבא · ' + order.total.toLocaleString('he-IL') + ' ₪';
    $('pAddr').textContent = order.name + ', ' + order.street + (order.apt ? ' ' + order.apt : '') + ', ' + order.city;
    if (c.payUrl) { $('payGrow').hidden = false; $('payBit').hidden = true; $('payGrowBtn').href = c.payUrl; }
    form.hidden = true; step2.hidden = false;
    step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    track('AddPaymentInfo', { currency: 'ILS', value: order.total, num_items: order.qty, content_name: 'חפיסת באבא' });
  });

  $('pEdit').onclick = function () { step2.hidden = true; form.hidden = false; form.scrollIntoView({ behavior: 'smooth' }); };
  $('pCopy').onclick = function () {
    var n = c.bitPhone.replace(/-/g, ''), b = this;
    (navigator.clipboard ? navigator.clipboard.writeText(n) : Promise.reject()).then(function () { b.textContent = 'הועתק ✓'; }, function () { b.textContent = n; });
  };

  // Sends the order to WhatsApp, then moves to the thank-you page.
  $('pDone').onclick = function () {
    var o = order, lines = [
      'הזמנה חדשה - חפיסת באבא', 'מספר הזמנה: ' + o.id,
      'כמות: ' + o.qty + ' · סה"כ ' + o.total + ' ₪',
      'שולם ב: ' + (c.payUrl ? 'כרטיס אשראי / ביט (דף תשלום)' : 'ביט / פייבוקס ל-' + c.bitPhone),
      '', 'שם: ' + o.name, 'טלפון: ' + o.phone
    ];
    if (o.email) lines.push('מייל: ' + o.email);
    lines.push('כתובת: ' + o.street + (o.apt ? ', ' + o.apt : '') + ', ' + o.city);
    if (o.notes) lines.push('הערות: ' + o.notes);
    window.open('https://wa.me/' + c.waPhone + '?text=' + encodeURIComponent(lines.join('\n')), '_blank');
    location.href = 'thanks/';
  };
  $('payGrowBtn').onclick = function () { $('pDone').textContent = 'שילמתי, שליחת ההזמנה'; };

  $('pBit').textContent = c.bitPhone;
  $('pBitName').textContent = 'על שם ' + c.bitName;
  render();
})();
