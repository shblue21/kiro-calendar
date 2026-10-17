import { SettingsSection, SettingsRow } from "./SettingsLayout";
import { ControlRow } from "../layout/Controls";
import { NativeSelect } from "../platform/kiro/NativeControls";
import { useAppApi, useAppInfo } from "@kirocrew/app-sdk";
import { Btn, Toggle } from "@kirocrew/app-sdk/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "../i18n/index.ts";
import type { Notice } from "../i18n/notice.ts";
import { notice, renderNotice } from "../i18n/notice.ts";
import { hookExecutionNotice } from "./proposalStatus";
type Settings = {
  suggestionsEnabled: boolean;
  timezone: string;
  revision: number;
  sessionKeys: string[];
};
type Payload = {
  settings: Settings;
  hook: {
    status: "ready" | "unconfigured" | "blocked" | "unknown";
    command?: string;
    lastStatus?: string;
    executionStatus?: string;
  };
  chats: {
    sessionKey: string;
    title: string;
  }[];
};
export function ProposalSettings() {
  const client = useAppApi();
  const api = useRef(client);
  api.current = client;
  const { name } = useAppInfo();
  const [data, setData] = useState<Payload>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Notice | null>(null);
  const [chosen, setChosen] = useState("");
  const [example, setExample] = useState(false);
  const mounted = useRef(true);
  const path = `/api/apps/${name}/settings`;
  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await api.current.get<Payload>(path);
      if (mounted.current) setData(next);
    } catch {
      if (mounted.current) setError(notice("suggestions.loadError"));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [path]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);
  async function save(changes: Partial<Settings>) {
    setBusy(true);
    setError(null);
    try {
      const next = await api.current.put<Payload>(path, changes);
      if (mounted.current) {
        setData(next);
        setChosen("");
      }
    } catch {
      if (mounted.current) setError(notice("suggestions.saveError"));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const enabled = data?.settings.suggestionsEnabled;
  const connected = data?.hook.status === "ready";
  const keys = data?.settings.sessionKeys ?? [];
  const canEnable = connected && keys.length > 0;
  const executionNotice = hookExecutionNotice(data?.hook.executionStatus);
  return (
    <SettingsSection
      title={t("common.eventSuggestionsInConversations")}
      actions={
        <Btn disabled={busy} onClick={() => void load()}>
          {t("common.refreshSettings")}
        </Btn>
      }
    >
      <SettingsRow
        action={
          <div className="cc-proposal-toggle">
            <span>
              {!data
                ? t("common.checking")
                : busy
                  ? t("common.savingStatus")
                  : enabled
                    ? "ON"
                    : "OFF"}
            </span>
            <Toggle
              checked={enabled ?? false}
              label={t("common.eventSuggestionsInConversations")}
              disabled={busy || !data || (!enabled && !canEnable)}
              onChange={(suggestionsEnabled) => void save({ suggestionsEnabled })}
            />
          </div>
        }
      >
        <p className="cc-page-section-note">
          {t("suggestions.description")}
          <br />
          {t("suggestions.reviewHint")}
        </p>
      </SettingsRow>
      <p className="cc-page-section-note">{t("suggestions.activationHint")}</p>
      {error && (
        <p role="alert" className="cc-page-section-note">
          {renderNotice(error)}
        </p>
      )}
      {data && !connected && (
        <p role="status" className="cc-page-section-note">
          {data.hook.status === "blocked"
            ? t("suggestions.policyBlocked")
            : t("suggestions.setupRequired")}
        </p>
      )}
      {connected && executionNotice && (
        <p
          className="cc-page-section-note"
          role={executionNotice.failure ? "alert" : "status"}
        >
          {executionNotice.text}
        </p>
      )}
      <details className="cc-settings-fold">
        <summary>{t("suggestions.conversationCount", { count: keys.length })}</summary>
        <p className="cc-page-section-note">{t("suggestions.scopeHint")}</p>
        {keys.map((key) => (
          <SettingsRow
            key={key}
            action={
              <Btn
                disabled={busy}
                onClick={() =>
                  void save({
                    sessionKeys: keys.filter((k) => k !== key),
                    ...(keys.length === 1 ? { suggestionsEnabled: false } : {}),
                  })
                }
              >
                {t("common.remove")}
              </Btn>
            }
          >
            <span>
              {data?.chats.find((c) => c.sessionKey === key)?.title ??
                t("common.closedConversation")}
            </span>
          </SettingsRow>
        ))}
        <div className="cc-proposal-actions">
          <ControlRow
            field={
              <NativeSelect
                aria-label={t("common.conversationForSuggestions")}
                value={chosen}
                disabled={busy || !data}
                onChange={(e) => setChosen(e.target.value)}
              >
                <option value="">{t("common.chooseAConversation")}</option>
                {data?.chats
                  .filter((c) => !keys.includes(c.sessionKey))
                  .map((c) => (
                    <option key={c.sessionKey} value={c.sessionKey}>
                      {c.title}
                    </option>
                  ))}
              </NativeSelect>
            }
            action={
              <Btn
                disabled={busy || !chosen}
                onClick={() => void save({ sessionKeys: [...keys, chosen] })}
              >
                {t("common.add")}
              </Btn>
            }
          />
        </div>
      </details>
      {data?.hook.command && !connected && (
        <details className="cc-settings-fold">
          <summary>{t("common.connectSuggestions")}</summary>
          <p className="cc-page-section-note">{t("suggestions.setupInstructions")}</p>
          <pre className="cc-hook-command">{data.hook.command}</pre>
        </details>
      )}
      <Btn aria-expanded={example} onClick={() => setExample((open) => !open)}>
        {t(example ? "suggestions.hideExample" : "suggestions.showExample")}
      </Btn>
      {example && (
        <div className="cc-proposal-example">
          <blockquote>
            {t("suggestions.exampleUser")}
            <br />
            {t("suggestions.exampleAssistant")}
          </blockquote>
        </div>
      )}
    </SettingsSection>
  );
}
