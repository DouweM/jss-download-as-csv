function dateFormatter(value) {
  if (!value) {
    return null;
  }

  var date = value.match(/^([0-9]{2}).([0-9]{2}).([0-9]{4})$/);
  return date[3] + "-" + date[2] + "-" + date[1];
}

function amountFormatter(value) {
  return value && parseFloat(value.replace(/'/g, ""));
}

function ensureDownloadButton() {
  var refreshButton = $(
    ".clx-context-menu-button",
    "#overviewRegion, #reviewPanel"
  );
  if (!refreshButton.length) {
    return;
  }

  insertDownloadButton(refreshButton);
}

var seen_pages = [];
var data = [];

function gatherData() {
  var region = $("#overviewRegion, #reviewPanel");
  var page_count = $(".pagingControls .pgButton:visible").length;

  if (page_count > 1 && seen_pages.length == 0) {
    console.log("Found " + page_count + " pages, switching...");
  }

  var current_page_button = $(".pagingControls .pgButton.jsActive:visible");

  while (seen_pages.length < page_count) {
    var current_page = current_page_button.text();
    if (seen_pages.indexOf(current_page) >= 0) {
      continue;
    }

    seen_pages.push(current_page);

    var page_data = tableData(region);
    data = data.concat(page_data);

    console.log(
      "Found " +
        page_data.length +
        " rows on page " +
        current_page +
        " of " +
        page_count
    );

    current_page_button = current_page_button.next();
    current_page_button.click();
  }

  download(region);
}

function download(region) {
  console.log(
    "Found " +
      data.length +
      " rows on " +
      seen_pages.length +
      " pages, downloading..."
  );

  var page_title;
  if (region.is("#reviewPanel")) {
    page_title = "Payments";
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      data[i] = {
        Account: row["Debit account"].match(/^[0-9.]+ [0-9]{4}/)[0],
        Date: dateFormatter(row["Execution date"]),
        Payee: row["Beneficiary name"],
        Amount: "-" + amountFormatter(row["Amount"]),
        Currency: row["Curr"],
        Notes: row["Beneficiary reference"],
      };
    }
  } else {
    page_title = "Transactions";
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      data[i] = {
        Account: ((value) => {
          if (!value) {
            return;
          }
          var match = value.match(/^[0-9.]+ [0-9]{4}/);
          if (match) {
            return match[0];
          }
          var match = value.match(/^s\/t Fixed Advance Fix \(BOR\) [A-Z]{3}/);
          if (match) {
            return match[0];
          }
          return value;
        })(row["Description"]),
        Date: dateFormatter(row["Booking date"]),
        Payee: row["Booking text"],
        Amount: amountFormatter(row["Settlement value"]),
        Currency: row["Curr"],
        Notes: "",
      };
    }
  }

  var segmented = {};
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var segment = row["Account"];
    segmented[segment] ||= [];
    segmented[segment].push(row);
  }

  for (var segment_title in segmented) {
    var segment = segmented[segment_title];
    var csv_data = [];
    for (var i = 0; i < segment.length; i++) {
      var row = segment[i];

      var keys = [];
      var values = [];
      for (var key in row) {
        keys.push(key);
        var value = row[key];
        if (!value) {
          value = "";
        } else {
          value = "" + value;
        }
        values.push(value.indexOf(",") >= 0 ? '"' + value + '"' : value);
      }
      if (i == 0) {
        csv_data.push(keys.join(","));
      }
      csv_data.push(values.join(","));
    }

    var csv = csv_data.join("\n");
    downloadFile(page_title + " - " + segment_title, csv);
  }

  data = [];
  seen_pages = [];
}
function insertDownloadButton(refreshButton) {
  var downloadButton = $(
    '<div class="clx-toolbar-component clx-button clx-overlay-parent clx-button-kind-icon jss-download-button"><button type="button" role="button"><div class="clx-button-middle"><div class="clx-button-icon-holder"><div class="clx-button-icon">💾</div></div></div></button></div>'
  ).on("click", gatherData);

  var existingButton = $(".jss-download-button:visible");
  if (existingButton.length) {
    existingButton.replaceWith(downloadButton);
  } else {
    refreshButton.before(downloadButton);
  }
}

function rowValues(row) {
  return $("td, th", row)
    .map((i, col) =>
      $(col)
        .contents()
        .map((i, e) => $(e).text())
        .get()
        .join(" ")
        .trim()
    )
    .get();
}

function tableData(region) {
  var tables = $("table:visible", region);
  var data = [];

  var floatingHeaderTable = tables.filter(".floatThead-table");
  if (floatingHeaderTable.length) {
    var rows = $("tr", tables[1]);
    var headerRow = $("tr", floatingHeaderTable)[0];
  } else {
    var rows = $("tr", tables[0]);
    var headerRow = rows[0];
  }
  var headers = rowValues(headerRow);

  for (var i = 1; i < rows.length; i++) {
    var values = rowValues(rows[i]);
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      item[headers[j]] = values[j];
    }
    data.push(item);
  }
  return data;
}

function formatData(data, formatters) {
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    for (var key in formatters) {
      row[key] = formatters[key](row[key], row);
    }
  }
}

function downloadFile(title, data) {
  var blob = new Blob([data], {
    type: "text/csv",
  });

  var temp_link = document.createElement("a");
  temp_link.download = title + ".csv";
  temp_link.href = window.URL.createObjectURL(blob);

  temp_link.style.display = "none";
  document.body.appendChild(temp_link);
  temp_link.click();
  document.body.removeChild(temp_link);
}

setInterval(ensureDownloadButton, 1000);
