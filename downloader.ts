import * as t from "https://esm.sh/io-ts@2.2.18";
import Queue from "https://esm.sh/p-queue@7.3.0";
import { Result, validateType, ValidationError } from "./util.ts";
import { OHCLResponse, StockDetailsResponse } from "./types.ts";
import * as path from "https://deno.land/std@0.156.0/path/mod.ts";
import { format } from "https://deno.land/std@0.156.0/datetime/mod.ts";

async function fetchEUAvaNumbers(): Promise<Set<string>> {
  const u = new URL(
    "https://www.avanza.se/frontend/template.html/marketing/advanced-filter/advanced-filter-template"
  );

  const params = [
    ["1623695203134", ""],
    // ["widgets.stockLists.filter.list[0]", "SE.LargeCap.SE"],
    // ["widgets.stockLists.filter.list[1]", "SE.MidCap.SE"],
    // ["widgets.stockLists.filter.list[2]", "SE.SmallCap.SE"],
    // ["widgets.stockLists.filter.list[3]", "SE.FNSE"],
    // ["widgets.stockLists.filter.list[4]", "DK.LargeCap.DK"],
    // ["widgets.stockLists.filter.list[5]", "DK.MidCap.DK"],
    // ["widgets.stockLists.filter.list[6]", "DK.SmallCap.DK"],
    // ["widgets.stockLists.filter.list[7]", "DK.FNDK"],
    // ["widgets.stockLists.filter.list[8]", "DK.XSAT"],
    // ["widgets.stockLists.filter.list[9]", "NO.OB Equity Certificates"],
    // ["widgets.stockLists.filter.list[10]", "NO.OB Match"],
    // ["widgets.stockLists.filter.list[11]", "NO.OB Standard"],
    // ["widgets.stockLists.filter.list[12]", "NO.OBX"],
    // ["widgets.stockLists.filter.list[13]", "NO.MERK"],
    // ["widgets.stockLists.filter.list[14]", "NO.XOAS"],
    // ["widgets.stockLists.filter.list[15]", "FI.LargeCap.FI"],
    // ["widgets.stockLists.filter.list[16]", "FI.MidCap.FI"],
    // ["widgets.stockLists.filter.list[17]", "FI.Prelist"],
    // ["widgets.stockLists.filter.list[18]", "FI.SmallCap.FI"],
    // ["widgets.stockLists.filter.list[19]", "FI.FNFI"],
    // ["widgets.stockLists.filter.list[20]", "BE.EQTB"],
    // ["widgets.stockLists.filter.list[21]", "FR.EQTB"],
    // ["widgets.stockLists.filter.list[22]", "IT.EQTB"],
    // ["widgets.stockLists.filter.list[23]", "NL.EQTB"],
    // ["widgets.stockLists.filter.list[24]", "PT.EQTB"],
    // ["widgets.stockLists.filter.list[25]", "DE.EQTB"],
    ["widgets.stockLists.filter.list[0]", "SE.Inofficiella"],
    ["widgets.stockLists.filter.list[1]", "SE.LargeCap.SE"],
    ["widgets.stockLists.filter.list[2]", "SE.Mangoldlistan"],
    ["widgets.stockLists.filter.list[3]", "SE.MidCap.SE"],
    ["widgets.stockLists.filter.list[4]", "SE.NGM PepMarket"],
    ["widgets.stockLists.filter.list[5]", "SE.Nordic SME Sweden"],
    ["widgets.stockLists.filter.list[6]", "SE.SPAC.SE"],
    ["widgets.stockLists.filter.list[7]", "SE.SmallCap.SE"],
    ["widgets.stockLists.filter.list[8]", "SE.Xterna listan"],
    ["widgets.stockLists.filter.list[9]", "SE.FNSE"],
    ["widgets.stockLists.filter.list[10]", "SE.XNGM"],
    ["widgets.stockLists.filter.list[11]", "SE.XSAT"],
    ["widgets.stockLists.active", "true"],
    ["parameters.startIndex", "0"],
    ["parameters.maxResults", "10000"],
    ["parameters.selectedFields[0]", "TICKER_SYMBOL"],
  ];

  for (const [key, value] of params) {
    u.searchParams.set(key, value);
  }

  const response = await fetch(u);

  const text = await response.text();

  const matches = text.matchAll(/kop\/[0-9]*/g);

  const nos: Set<string> = new Set();

  for (const match of matches) {
    nos.add(match[0].split("/")[1].trim());
  }

  return nos;
}

type AvaResponse = t.TypeOf<typeof OHCLResponse>;

async function fetchAvaNoOHCL(
  id: string
): Promise<Result<AvaResponse> | ValidationError> {
  // const url = `https://www.avanza.se/_api/price-chart/stock/${id}?timePeriod=one_month&resolution=hour`;
  const url = `https://www.avanza.se/_api/price-chart/stock/${id}?timePeriod=three_years&resolution=day`;
  // const url = `https://www.avanza.se/_api/price-chart/stock/${id}?timePeriod=one_year&resolution=day`;
  // const url = `https://www.avanza.se/_api/price-chart/stock/${id}?timePeriod=infinity`;
  console.log(url);

  const response = await fetch(url);
  const data = await response.json();

  return validateType(OHCLResponse, data);
}

async function fetchAvaNoDetails(id: string) {
  const url = `https://www.avanza.se/_mobile/market/stock/${id}`;
  console.log(url);

  const response = await fetch(url);
  const data = await response.json();

  return validateType(StockDetailsResponse, data);
}

function makeSureDirExists(dir: string) {
  try {
    Deno.mkdirSync(dir, { recursive: true });
  } catch (e) {
    //ignore
    console.log(e);
  }
}

function fileExists(path: string) {
  try {
    Deno.statSync(path);
    return true;
  } catch (_e) {
    return false;
  }
}

async function fetchAvaData(): Promise<void> {
  const dirname = path.dirname(path.fromFileUrl(import.meta.url));
  const fullDirName = path.join(
    dirname,
    "data",
    format(new Date(), "yyyy-MM-dd")
  );

  makeSureDirExists(fullDirName);
  const data = await fetchEUAvaNumbers();
  const queue = new Queue({ concurrency: 5 });

  const jobs = Array.from(data)
    // .slice(0, 30)
    .map((no) => {
      return async () => {
        const filename = path.join(fullDirName, `${no}.json`);

        if (fileExists(filename)) {
          console.log(`Skipping ${no}`);
          return;
        }

        const [detailsResult, OHCLResult] = await Promise.all([
          fetchAvaNoDetails(no),
          fetchAvaNoOHCL(no),
        ]);

        if (detailsResult.isError || OHCLResult.isError) {
          console.log(`Failed to fetch ${no}`);
          if (detailsResult.isError) {
            console.log(`Details error for ${no}`);
            console.log(JSON.stringify(detailsResult.error, null, 2));
          }

          if (OHCLResult.isError) {
            console.log(`Failed to fetch OHCL for ${no}`);
            console.log(JSON.stringify(OHCLResult.error, null, 2));
          }
        } else {
          console.log(`Fetched ${no}, writing to ${filename}`);
          await Deno.writeTextFile(
            filename,
            JSON.stringify({
              details: detailsResult.result,
              ohcl: OHCLResult.result,
            })
          );
        }
      };
    });

  await queue.addAll(jobs);
}

if (import.meta.main) {
  console.log("main");
  await fetchAvaData();
  Deno.exit();
}
