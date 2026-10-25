function publicError_(error) {
  var message = error && error.message ? error.message : 'FinTrack Lite could not complete the request.';
  return new Error(message);
}

function requireNonEmptyString_(value, label, maximumLength) {
  var normalized = String(value == null ? '' : value).trim();
  if (!normalized) {
    throw new Error(label + ' is required.');
  }
  if (normalized.length > maximumLength) {
    throw new Error(label + ' must be ' + maximumLength + ' characters or fewer.');
  }
  return normalized;
}

function requireEnum_(value, allowed, label) {
  if (allowed.indexOf(value) < 0) {
    throw new Error(label + ' must be one of: ' + allowed.join(', ') + '.');
  }
  return value;
}

function requirePositiveAmount_(value) {
  var amount = Number(value);
  if (!isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a finite number greater than 0.');
  }
  var rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  if (rounded <= 0) {
    throw new Error('Amount must round to at least 0.01.');
  }
  return rounded;
}

function requireIsoDateNotFuture_(value) {
  var date = requireNonEmptyString_(value, 'Date', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date + 'T00:00:00Z').getTime()) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) {
    throw new Error('Date must use YYYY-MM-DD.');
  }
  if (date > todayIso_()) {
    throw new Error('Date cannot be later than today.');
  }
  return date;
}

function requireNonNegativeAmount_(value, label) {
  var amount = Number(value);
  if (!isFinite(amount) || amount < 0) {
    throw new Error((label || 'Amount') + ' must be a finite number of 0 or more.');
  }
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function optionalString_(value, label, maximumLength) {
  var normalized = String(value == null ? '' : value).trim();
  if (normalized.length > maximumLength) {
    throw new Error(label + ' must be ' + maximumLength + ' characters or fewer.');
  }
  return normalized;
}

function requireId_(value, label) {
  return requireNonEmptyString_(value, label || 'ID', 100);
}

function rejectUnexpectedFields_(payload, allowedFields, label) {
  Object.keys(payload || {}).forEach(function (key) {
    if (allowedFields.indexOf(key) < 0) {
      throw new Error((label || 'Request') + ' cannot change "' + key + '".');
    }
  });
}

