import { OHCLResponse, StockDetailsResponse } from "./types.ts";
import * as t from "https://esm.sh/io-ts@2.2.18";
import { validateType, ValidationError, Result } from "./util.ts";
import { open } from "https://deno.land/x/open@v0.0.5/index.ts";
import * as path from "https://deno.land/std@0.156.0/path/mod.ts";
import { format } from "https://deno.land/std@0.156.0/datetime/mod.ts";

const StockData = t.array(
  t.type({
    details: StockDetailsResponse,
    ohcl: OHCLResponse,
  })
);

type StockDataType = t.TypeOf<typeof StockData>;

function readAll(): Result<StockDataType> | ValidationError {
  const base = path.dirname(path.fromFileUrl(import.meta.url));
  const fullDirName = path.join(base, "data", format(new Date(), "yyyy-MM-dd"));

  const files = Array.from(Deno.readDirSync(fullDirName));
  const jsonFiles = files
    .filter((f) => f.name.endsWith(".json"))
    .map((f) => path.join(fullDirName, f.name));

  const data = jsonFiles.map((f) => {
    const data = Deno.readTextFileSync(f);
    return JSON.parse(data);
  });

  return validateType(
    t.array(
      t.type({
        details: StockDetailsResponse,
        ohcl: OHCLResponse,
      })
    ),
    data
  );
}

function find() {
  const f = readAll();

  if (f.isError) {
    console.log("Error");
    console.log(JSON.stringify(f.error, null, 2));
    return;
  }

  const data = f.result;

  // find highest increase among "low" volatility stocks for the last 30 trading days
  const byups = data
    .filter((d) => d.details.keyRatios.volatility < 20)
    .map((d) => {
      const lastxd = d.ohcl.ohlc.slice(-30);

      return {
        name: d.details.name,
        id: d.details.id,
        diff:
          (lastxd[lastxd.length - 1].close - lastxd[0].close) / lastxd[0].close,
        volatility: d.details.keyRatios.volatility,
        url: `https://www.avanza.se/aktier/om-aktien.html/${d.details.id}`,
        firstDay: format(new Date(lastxd[0].timestamp), "yyyy-MM-dd"),
      };
    });

  const sorted = byups.sort((a, b) => b.diff - a.diff);

  const out = sorted
    .slice(0, 5)
    .map((a) => {
      open(a.url);
      return `${a.name} (${a.firstDay}) ${a.volatility} ${a.url} ${(
        a.diff * 100
      ).toFixed(2)}%`;
    })
    .join("\n");

  console.log(out);
}

if (import.meta.main) {
  console.log("main");
  find();
  Deno.exit();
}
