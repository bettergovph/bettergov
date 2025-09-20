import fs from "fs"

function formatList(data) {
  const house_members = []
  const party_list_representatives = []

  data.map(d => {
    if (d.member_type === "Party List Representative") {
      party_list_representatives.push({
        party_list: d.memberships.party_list_name,
        name: d.fullname,
        contact: `${d.directline || "__"}; local ${d.local || "__"}`,
      })
    } else {
      house_members.push({
        province_city: d.memberships.dist_name,
        name: d.fullname,
        district:
          d.memberships.dist_desc === "Lone District"
            ? "Lone"
            : d.memberships.dist_desc,
        contact: `${d.directline || "__"}; local ${d.local || "__"}`,
      })
    }
  })

  fs.writeFileSync("house_members.json", JSON.stringify(house_members))
  fs.writeFileSync(
    "party_list_representatives.json",
    JSON.stringify(party_list_representatives)
  )
}

async function fetchHrep() {
  const response = await fetch(process.env.HREP_SERVICE_URL, {
    method: "POST",
    headers: {
      "x-hrep-website-backend": process.env.HREP_SERVICE_TOKEN,
      "content-type": "application/json",
      origin: "",
      priority: "",
      referer: "",
    },
    body: JSON.stringify({
      page: 0,
      limit: 500,
      filter: "",
      type: "all",
    }),
  })

  const jsonResponse = await response.json()
  formatList(jsonResponse.data.rows)
}

fetchHrep()
