import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const keytar = require("C:/Users/HP/AppData/Roaming/npm/node_modules/genlayer/node_modules/keytar");

const sdk = await import(
  "file:///C:/Users/HP/AppData/Roaming/npm/node_modules/genlayer/node_modules/genlayer-js/dist/index.js"
);
const chains = await import(
  "file:///C:/Users/HP/AppData/Roaming/npm/node_modules/genlayer/node_modules/genlayer-js/dist/chains/index.js"
);

const DEFAULT_CONTRACT_ADDRESS = "0x4a79710A4B739698E929b31363720A39834Fb99c";
const PRINCIPAL_ACCOUNT = "briefbond-freelancer";
const OPERATOR_ACCOUNT = "briefbond-trigger";
const RECIPIENT_ADDRESS = "0xd40204e290b887644cb1f181d84b783e5ad281da";

const MANDATE_V1 = JSON.stringify({
  name: "MandateVault security-work budget",
  objective: "Pay for completed independent security review work that directly benefits the MandateVault GenLayer Intelligent Contract.",
  prohibited: [
    "marketing",
    "advertising",
    "event sponsorship",
    "travel",
    "general-purpose hardware",
  ],
  conditions: [
    "the public evidence must identify MandateVault",
    "the work must be completed rather than merely proposed",
    "the evidence must state supplier and invoice",
    "the deliverable must describe reviewed technical scope or findings",
  ],
});

const MANDATE_V2 = JSON.stringify({
  name: "MandateVault security and remediation budget",
  objective: "Pay for completed independent security reviews or verified vulnerability remediation that directly benefits MandateVault.",
  prohibited: [
    "marketing",
    "advertising",
    "event sponsorship",
    "travel",
    "general-purpose hardware",
  ],
  conditions: [
    "the public evidence must identify MandateVault",
    "the work must be completed rather than merely proposed",
    "the evidence must state supplier and invoice",
    "the deliverable must describe technical scope, findings, or verified remediation",
  ],
});

const EVIDENCE_POLICY = JSON.stringify({
  required: [
    "a public HTTPS deliverable",
    "an identified supplier",
    "an invoice reference",
    "specific technical scope or findings",
  ],
  accepted_host: "raw.githubusercontent.com/Hilda26/mandate-vault",
  reject_if: [
    "the evidence describes marketing or an event",
    "the evidence does not describe completed technical work",
    "the evidence contradicts the proposal purpose",
  ],
});

const GOOD_PURPOSE = JSON.stringify({
  category: "security_review",
  summary: "Pay the supplier for its completed independent review of MandateVault's value-routing and state-machine invariants.",
  invoice: "MV-2026-1017",
});

const GOOD_EVIDENCE = JSON.stringify({
  primary_url: "https://raw.githubusercontent.com/Hilda26/mandate-vault/main/live-evidence/compliant-security-review.md",
  supplier: "Cipher Review Collective",
  invoice: "MV-2026-1017",
  public: true,
});

const BAD_PURPOSE = JSON.stringify({
  category: "event_sponsorship",
  summary: "Sponsor a promotional MandateVault launch party with banners, influencers, catering, and merchandise.",
  invoice: "PARTY-2026-44",
});

const BAD_EVIDENCE = JSON.stringify({
  primary_url: "https://raw.githubusercontent.com/Hilda26/mandate-vault/main/live-evidence/prohibited-marketing-proposal.md",
  supplier: "LaunchSpark Events",
  invoice: "PARTY-2026-44",
  public: true,
});

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx === process.argv.length - 1) return fallback;
  return process.argv[idx + 1];
}

async function getClient(accountName) {
  const privateKey = await keytar.getPassword("genlayer-cli", `account:${accountName}`);
  if (!privateKey) throw new Error(`Account ${accountName} is not unlocked in the OS keychain.`);
  const account = sdk.createAccount(privateKey);
  const client = sdk.createClient({ chain: chains.studionet, account });
  await client.initializeConsensusSmartContract();
  return { client, account, accountName };
}

function serialize(value) {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Map) {
    return Object.fromEntries(Array.from(value.entries()).map(([key, val]) => [key, serialize(val)]));
  }
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, serialize(val)]));
  }
  return value;
}

function summarizeReceipt(label, hash, receipt) {
  const leader = receipt.consensus_data?.leader_receipt?.[0] ?? {};
  const genvm = leader.genvm_result ?? {};
  const statusName = receipt.status_name ?? receipt.statusName ?? String(receipt.status ?? "");
  const resultName = receipt.result_name ?? receipt.resultName ?? String(receipt.result ?? "");
  const summary = {
    label,
    hash,
    statusName,
    resultName,
    leaderExecution: leader.execution_result ?? "",
    stdout: genvm.stdout ?? "",
    stderr: genvm.stderr ?? "",
    rawError: genvm.raw_error ?? null,
  };
  const accepted = ["FINALIZED", "ACCEPTED"].some((needle) =>
    String(statusName).toUpperCase().includes(needle),
  );
  if (!accepted || summary.leaderExecution === "ERROR" || summary.stderr || summary.rawError) {
    throw new Error(`${label} failed receipt checks: ${JSON.stringify(summary)}`);
  }
  return summary;
}

async function writeTx(client, address, label, functionName, args, value = 0n) {
  const hash = await client.writeContract({ address, functionName, args, value });
  const receipt = await client.waitForTransactionReceipt({
    hash,
    retries: 180,
    interval: 5000,
  });
  const summary = summarizeReceipt(label, hash, receipt);
  console.log(JSON.stringify(summary));
  return summary;
}

async function readCall(client, address, functionName, args = []) {
  return serialize(await client.readContract({ address, functionName, args }));
}

async function main() {
  const contractAddress = argValue("--contract", DEFAULT_CONTRACT_ADDRESS);
  const outPath = argValue("--out", `live-studionet-${Date.now()}.json`);
  const principal = await getClient(PRINCIPAL_ACCOUNT);
  const operator = await getClient(OPERATOR_ACCOUNT);

  const beforeVaultCount = Number(await readCall(principal.client, contractAddress, "vault_count"));
  const beforeProposalCount = Number(
    await readCall(principal.client, contractAddress, "proposal_count_total"),
  );
  const vaultId = beforeVaultCount;
  const goodProposalId = beforeProposalCount;
  const badProposalId = beforeProposalCount + 1;
  const records = [
    {
      label: "initial-read-counts",
      vaultCount: beforeVaultCount,
      proposalCount: beforeProposalCount,
      principal: principal.account.address,
      operator: operator.account.address,
      recipient: RECIPIENT_ADDRESS,
    },
  ];

  records.push(
    await writeTx(
      principal.client,
      contractAddress,
      "create-vault",
      "create_vault",
      [operator.account.address, MANDATE_V1, EVIDENCE_POLICY, 3, 2, 1, 3600, 1800],
      3n,
    ),
  );
  records.push({
    label: "after-create-get-vault",
    vaultId,
    vault: await readCall(principal.client, contractAddress, "get_vault", [vaultId]),
  });

  records.push(
    await writeTx(
      operator.client,
      contractAddress,
      "submit-compliant-proposal",
      "submit_proposal",
      [vaultId, RECIPIENT_ADDRESS, 2, GOOD_PURPOSE, GOOD_EVIDENCE],
      1n,
    ),
  );
  records.push({
    label: "after-good-submit",
    proposalId: goodProposalId,
    proposal: await readCall(principal.client, contractAddress, "get_proposal", [goodProposalId]),
  });

  records.push(
    await writeTx(
      principal.client,
      contractAddress,
      "update-mandate-after-submit",
      "update_mandate",
      [vaultId, MANDATE_V2, EVIDENCE_POLICY],
    ),
  );

  records.push(
    await writeTx(
      principal.client,
      contractAddress,
      "review-compliant-proposal",
      "review_proposal",
      [goodProposalId],
    ),
  );

  records.push(
    await writeTx(
      operator.client,
      contractAddress,
      "submit-prohibited-proposal",
      "submit_proposal",
      [vaultId, RECIPIENT_ADDRESS, 1, BAD_PURPOSE, BAD_EVIDENCE],
      1n,
    ),
  );
  records.push(
    await writeTx(
      principal.client,
      contractAddress,
      "review-prohibited-proposal",
      "review_proposal",
      [badProposalId],
    ),
  );

  const finalVault = await readCall(principal.client, contractAddress, "get_vault", [vaultId]);
  const goodProposal = await readCall(
    principal.client,
    contractAddress,
    "get_proposal",
    [goodProposalId],
  );
  const badProposal = await readCall(
    principal.client,
    contractAddress,
    "get_proposal",
    [badProposalId],
  );
  const finalVaultCount = Number(await readCall(principal.client, contractAddress, "vault_count"));
  const finalProposalCount = Number(
    await readCall(principal.client, contractAddress, "proposal_count_total"),
  );

  records.push({ label: "final-get-vault", vaultId, vault: finalVault });
  records.push({ label: "final-get-good-proposal", proposalId: goodProposalId, proposal: goodProposal });
  records.push({ label: "final-get-bad-proposal", proposalId: badProposalId, proposal: badProposal });
  records.push({
    label: "final-read-counts",
    vaultCount: finalVaultCount,
    proposalCount: finalProposalCount,
  });

  if (finalVault.mandate_version !== 2 && finalVault.mandate_version !== "2") {
    throw new Error(`Expected mandate version 2, got ${finalVault.mandate_version}`);
  }
  if (goodProposal.mandate_version !== 1 && goodProposal.mandate_version !== "1") {
    throw new Error(`Expected good proposal snapshot version 1, got ${goodProposal.mandate_version}`);
  }
  if (goodProposal.status !== "PAID" || goodProposal.reason_code !== "MANDATE_COMPLIANT") {
    throw new Error(`Expected compliant proposal PAID/MANDATE_COMPLIANT, got ${JSON.stringify(goodProposal)}`);
  }
  if (badProposal.status !== "REJECTED" || badProposal.reason_code !== "PROHIBITED_EXPENSE") {
    throw new Error(`Expected prohibited proposal REJECTED/PROHIBITED_EXPENSE, got ${JSON.stringify(badProposal)}`);
  }
  if (Number(finalVault.spent) !== 2 || Number(finalVault.reserved) !== 0 || Number(finalVault.available_budget) !== 1) {
    throw new Error(`Unexpected final vault accounting: ${JSON.stringify(finalVault)}`);
  }
  if (finalVaultCount !== beforeVaultCount + 1 || finalProposalCount !== beforeProposalCount + 2) {
    throw new Error("Final counters do not match one new vault and two new proposals.");
  }

  const report = {
    generatedAt: new Date().toISOString(),
    contractAddress,
    vaultId,
    goodProposalId,
    badProposalId,
    passed: true,
    records,
  };
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ outPath, passed: true, vaultId, goodProposalId, badProposalId }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

