const base = "http://localhost:3000";

const paths = [
  "/",
  "/properties",
  "/properties?type=rent",
  "/properties?type=sale",
  "/properties/heaton-victorian-semi",
  "/properties/city-centre-apartment",
  "/contact?reason=general",
  "/enquire",
  "/login",
  "/account",
  "/admin",
  "/saved-properties",
  "/property-value-calculator",
  "/free-valuation",
  "/stamp-duty",
  "/sell",
  "/sell/auction",
  "/sell/marketing",
  "/buy",
  "/buy/auction",
  "/sales",
  "/rent",
  "/lettings",
  "/landlords",
  "/landlords/managed",
  "/landlords/marketing",
  "/landlords/insurance",
  "/landlords/rent-cover",
  "/landlords/charges",
  "/landlords/responsibilities",
  "/mortgages",
  "/mortgages/buy-to-let",
  "/conveyancing",
  "/removal-services",
  "/about",
  "/about/community",
  "/careers",
  "/news",
  "/branches",
  "/area-guides",
  "/rent/report-repair",
  "/rent/end-of-tenancy",
  "/rent/tenant-charges",
  "/rent/contents-insurance",
  "/privacy",
  "/terms",
  "/accessibility",
  "/refund",
];

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function get(path) {
  const started = Date.now();
  const res = await fetch(base + path, { redirect: "follow" });
  const html = await res.text();
  const text = stripTags(html);
  const comingSoon = /coming soon|full content for this section is coming soon/i.test(
    text,
  );
  const emptyish =
    text.length < 400 ||
    (!/<h1[\s>]/i.test(html) && text.length < 800);
  return {
    path,
    status: res.status,
    finalUrl: res.url,
    ms: Date.now() - started,
    bytes: html.length,
    textLen: text.length,
    hasH1: /<h1[\s>]/i.test(html),
    comingSoon,
    emptyish,
    preview: text.slice(0, 160),
  };
}

async function postEnquiry(body) {
  const res = await fetch(base + "/api/enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  const pageResults = [];
  for (const path of paths) {
    try {
      pageResults.push(await get(path));
    } catch (error) {
      pageResults.push({
        path,
        status: 0,
        error: String(error),
        emptyish: true,
        comingSoon: false,
        hasH1: false,
        textLen: 0,
      });
    }
  }

  console.log("=== PAGE STATUS ===");
  for (const row of pageResults) {
    console.log(
      `${row.status}\t${row.textLen || 0}\t${row.hasH1 ? "H1" : "--"}\t${row.comingSoon ? "SOON" : ""}${row.emptyish ? "THIN" : ""}\t${row.path}${row.finalUrl && !row.finalUrl.endsWith(row.path.split("?")[0]) ? " -> " + row.finalUrl : ""}`,
    );
  }

  console.log("\n=== EMPTY / THIN / SOON / FAIL ===");
  for (const row of pageResults.filter(
    (r) => r.emptyish || r.comingSoon || r.status !== 200,
  )) {
    console.log(
      JSON.stringify({
        path: row.path,
        status: row.status,
        textLen: row.textLen,
        comingSoon: row.comingSoon,
        preview: row.preview,
        error: row.error,
      }),
    );
  }

  console.log("\n=== ENQUIRY RULES ===");
  const cases = [
    [
      "guest_ok",
      {
        name: "Guest Deep",
        email: "guest.deep@example.com",
        phone: "07700900456",
        message: "Deep smoke guest message",
        source: "contact",
        reason: "general",
      },
    ],
    [
      "guest_no_phone",
      {
        name: "Guest Deep",
        email: "guest.deep2@example.com",
        phone: "",
        message: "Missing phone",
        source: "contact",
        reason: "general",
      },
    ],
    [
      "guest_no_name",
      {
        name: "",
        email: "guest.deep3@example.com",
        phone: "07700900456",
        message: "Missing name",
        source: "contact",
        reason: "general",
      },
    ],
    [
      "guest_no_email",
      {
        name: "Guest",
        email: "bad",
        phone: "07700900456",
        message: "Bad email",
        source: "contact",
        reason: "general",
      },
    ],
    [
      "user_message_only",
      {
        name: "Test Client",
        email: "client.test@mrahavenestates.co.uk",
        phone: "",
        message: "User deep smoke question",
        source: "contact",
        reason: "general",
        allowMissingPhone: true,
      },
    ],
    [
      "admin_block",
      {
        name: "Admin",
        email: "mrahavenestates@gmail.com",
        phone: "07700900456",
        message: "Should fail",
        source: "contact",
        reason: "general",
      },
    ],
    [
      "property_guest",
      {
        name: "Guest Prop",
        email: "guest.prop@example.com",
        phone: "07700900456",
        message: "Property question",
        source: "property-enquiry",
        property: {
          slug: "heaton-victorian-semi",
          title: "Heaton Victorian Semi",
          location: "Bradford",
          price: "£285,000",
          status: "For Sale",
          type: "sale",
          beds: 3,
          baths: 2,
          area: "1250",
        },
      },
    ],
  ];

  for (const [name, body] of cases) {
    const result = await postEnquiry(body);
    console.log(
      name,
      result.status,
      result.json.ok,
      result.json.error || result.json.enquiry?.id || "",
    );
  }

  console.log("\n=== PROPERTIES API ===");
  for (const api of [
    "/api/properties",
    "/api/properties?type=sale",
    "/api/properties?type=rent",
  ]) {
    const res = await fetch(base + api);
    const json = await res.json();
    console.log(api, res.status, "count=", json.properties?.length);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
