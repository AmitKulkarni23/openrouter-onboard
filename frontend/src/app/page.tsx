/**
 * Main application page — split-pane layout with a YAML editor (left)
 * and sequential onboarding checklist (right). Supports two modes:
 *   LOCAL MODE  — validates YAML structure offline
 *   CONNECTED   — proxies real calls to OpenRouter's API via /api/openrouter
 */
"use client";

import { useState, useCallback, useRef } from "react";
import * as yaml from "js-yaml";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import { useTheme } from "@mui/material/styles";
import { DEFAULT_MANIFEST } from "@/lib/default-manifest";
import { STEPS } from "@/lib/steps";
import { validateStep, type ValidationResult, type Check } from "@/lib/validation";
import { validateStepConnected } from "@/lib/connected-validation";

type StepState = "locked" | "active" | "passed" | "failed";

interface StepResult {
  result: ValidationResult;
}

export default function Home() {
  const theme = useTheme();
  const [yamlText, setYamlText] = useState(DEFAULT_MANIFEST);
  const [parseError, setParseError] = useState<string | null>(null);
  const [stepStates, setStepStates] = useState<StepState[]>(() =>
    STEPS.map((_, i) => (i === 0 ? "active" : "locked"))
  );
  const [stepResults, setStepResults] = useState<(StepResult | null)[]>(() =>
    STEPS.map(() => null)
  );
  const [verifying, setVerifying] = useState(false);
  const [connected, setConnected] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCountRef = useRef<HTMLDivElement>(null);

  const activeStep = stepStates.indexOf("active");
  const failedStep = stepStates.indexOf("failed");
  const currentStep = failedStep !== -1 ? failedStep : activeStep;

  const parsedManifest = (() => {
    try {
      const parsed = yaml.load(yamlText);
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  })();

  const handleYamlChange = (value: string) => {
    setYamlText(value);
    try {
      yaml.load(value);
      setParseError(null);
    } catch (e) {
      if (e instanceof yaml.YAMLException) {
        setParseError(`Line ${e.mark?.line ? e.mark.line + 1 : "?"}: ${e.reason}`);
      }
    }
  };

  // Extract the API key from the YAML when connected mode needs it
  const apiKey = parsedManifest
    ? ((parsedManifest as Record<string, Record<string, unknown>>).organization?.api_key as string | null)
    : null;

  const handleVerify = useCallback(async () => {
    if (currentStep === -1 || !parsedManifest) return;
    setVerifying(true);

    let result: ValidationResult;

    if (connected && apiKey) {
      // Connected mode: make real API calls through the proxy
      result = await validateStepConnected(currentStep, parsedManifest, apiKey);
    } else {
      // Local mode: validate YAML structure only
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      result = validateStep(currentStep, parsedManifest);
    }

    const newStates = [...stepStates];
    const newResults = [...stepResults];

    newResults[currentStep] = { result };

    if (result.passed) {
      newStates[currentStep] = "passed";
      if (currentStep + 1 < STEPS.length) {
        newStates[currentStep + 1] = "active";
      }
    } else {
      newStates[currentStep] = "failed";
    }

    setStepStates(newStates);
    setStepResults(newResults);
    setVerifying(false);
  }, [currentStep, parsedManifest, stepStates, stepResults, connected, apiKey]);

  const lineCount = yamlText.split("\n").length;
  const allPassed = stepStates.every((s) => s === "passed");
  const passedCount = stepStates.filter((s) => s === "passed").length;

  const handleScroll = () => {
    if (textareaRef.current && lineCountRef.current) {
      lineCountRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "surface" }}>
      {/* ── Connection Bar ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 48,
          px: 2.5,
          bgcolor: "background.paper",
          borderBottom: `1px solid ${theme.palette.grid}`,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="18" height="18" rx="2" stroke={theme.palette.ink} strokeWidth="1.5" fill="none" />
            <line x1="5" y1="1" x2="5" y2="19" stroke={theme.palette.grid} strokeWidth="0.5" />
            <line x1="10" y1="1" x2="10" y2="19" stroke={theme.palette.grid} strokeWidth="0.5" />
            <line x1="15" y1="1" x2="15" y2="19" stroke={theme.palette.grid} strokeWidth="0.5" />
            <line x1="1" y1="5" x2="19" y2="5" stroke={theme.palette.grid} strokeWidth="0.5" />
            <line x1="1" y1="10" x2="19" y2="10" stroke={theme.palette.grid} strokeWidth="0.5" />
            <line x1="1" y1="15" x2="19" y2="15" stroke={theme.palette.grid} strokeWidth="0.5" />
            <line x1="3" y1="17" x2="17" y2="3" stroke={theme.palette.blue} strokeWidth="1.5" />
          </svg>
          <Typography variant="h6" sx={{ fontSize: "0.8125rem" }}>
            OPENROUTER ONBOARD
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: connected ? "pass" : "inkMuted",
              flexShrink: 0,
            }}
          />
          <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
            {connected ? "CONNECTED" : "LOCAL MODE"}
          </Typography>
          {connected ? (
            <Button
              size="small"
              startIcon={<LinkOffIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => setConnected(false)}
              sx={{
                ml: 2,
                fontSize: "0.6875rem",
                color: "text.secondary",
                borderColor: "grid",
                "&:hover": { borderColor: "error.main", color: "error.main" },
              }}
              variant="outlined"
            >
              DISCONNECT
            </Button>
          ) : (
            <Button
              size="small"
              startIcon={<LinkIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => {
                if (!apiKey) {
                  setParseError("Set organization.api_key in the YAML to connect");
                  return;
                }
                setConnected(true);
              }}
              sx={{
                fontSize: "0.6875rem",
                color: "text.secondary",
                borderColor: "grid",
                "&:hover": { borderColor: "primary.main", color: "primary.main" },
              }}
              variant="outlined"
            >
              CONNECT
            </Button>
          )}
        </Box>

        <Button
          variant="contained"
          onClick={handleVerify}
          disabled={verifying || currentStep === -1 || !!parseError || !parsedManifest || allPassed}
          startIcon={
            verifying ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="2" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )
          }
          sx={{ fontSize: "0.8125rem", px: 2.5 }}
        >
          {allPassed ? "ALL VERIFIED" : "VERIFY"}
        </Button>
      </Box>

      {/* ── Split Pane ── */}
      <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* ── Editor Pane ── */}
        <Box sx={{ flex: "0 0 42%", display: "flex", flexDirection: "column", bgcolor: "editorGround", minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              height: 36,
              px: 2,
              bgcolor: "editorLine",
              borderBottom: `1px solid ${theme.palette.editorGutter}`,
              flexShrink: 0,
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />
            <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "editorText" }}>
              manifest.yaml
            </Typography>
            {parseError && (
              <Typography
                sx={{
                  ml: "auto",
                  color: "error.main",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 260,
                }}
              >
                {parseError}
              </Typography>
            )}
          </Box>

          <Box sx={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
            <Box
              ref={lineCountRef}
              sx={{
                width: 44,
                py: 1.5,
                overflow: "hidden",
                flexShrink: 0,
                bgcolor: "editorGround",
                borderRight: `1px solid ${theme.palette.editorLine}`,
              }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <Box
                  key={i}
                  sx={{
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    pr: 1.5,
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    color: "editorGutter",
                    userSelect: "none",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {i + 1}
                </Box>
              ))}
            </Box>
            <Box
              component="textarea"
              ref={textareaRef}
              value={yamlText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleYamlChange(e.target.value)}
              onScroll={handleScroll}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              sx={{
                flex: 1,
                p: 1.5,
                pl: 2,
                bgcolor: "editorGround",
                color: "editorText",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                lineHeight: "20px",
                border: "none",
                resize: "none",
                outline: "none",
                whiteSpace: "pre",
                overflowWrap: "normal",
                overflowX: "auto",
                overflowY: "auto",
                tabSize: 2,
                "&::selection": {
                  bgcolor: "rgba(0, 87, 255, 0.3)",
                },
              }}
            />
          </Box>
        </Box>

        {/* ── Divider ── */}
        <Box sx={{ width: "1px", bgcolor: "grid", flexShrink: 0 }} />

        {/* ── Checklist Pane ── */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            bgcolor: "surface",
            backgroundImage: `radial-gradient(circle, ${theme.palette.grid} 0.8px, transparent 0.8px)`,
            backgroundSize: "20px 20px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 36,
              px: 3,
              borderBottom: `1px solid ${theme.palette.grid}`,
              flexShrink: 0,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
              ONBOARDING CHECKLIST
            </Typography>
            <Typography
              sx={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "text.secondary",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {passedCount}/{STEPS.length}
            </Typography>
          </Box>

          <Box sx={{ flex: 1, display: "flex", overflowY: "auto", p: 2.5, pl: 2.5 }}>
            {/* Dependency Line */}
            <Box sx={{ width: 2, display: "flex", flexDirection: "column", flexShrink: 0, ml: "17px" }}>
              {STEPS.map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: 1,
                    bgcolor: stepStates[i] === "passed" ? "pass" : "grid",
                    transition: "background 0.3s ease",
                  }}
                />
              ))}
            </Box>

            {/* Steps */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
              {STEPS.map((step, i) => (
                <StepCard
                  key={i}
                  index={i}
                  step={step}
                  state={stepStates[i]}
                  result={stepResults[i]}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function StepCard({
  index,
  step,
  state,
  result,
}: {
  index: number;
  step: (typeof STEPS)[number];
  state: StepState;
  result: StepResult | null;
}) {
  const theme = useTheme();
  const isExpanded = state === "active" || state === "failed";

  const borderColor =
    state === "active"
      ? theme.palette.blue
      : state === "passed"
        ? theme.palette.pass
        : state === "failed"
          ? theme.palette.fail
          : theme.palette.grid;

  const bgColor =
    state === "passed"
      ? theme.palette.passLight
      : state === "failed"
        ? theme.palette.failLight
        : state === "locked"
          ? "transparent"
          : theme.palette.background.paper;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        p: "14px 16px",
        border: `1px solid ${borderColor}`,
        borderBottom: "none",
        bgcolor: bgColor,
        transition: "border-color 0.2s, background-color 0.2s",
        "&:last-child": { borderBottom: `1px solid ${borderColor}` },
      }}
    >
      {/* Step Indicator */}
      <Box
        sx={{
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          mt: "1px",
        }}
      >
        {state === "passed" ? (
          <CheckIcon sx={{ fontSize: 16, color: "pass" }} />
        ) : state === "failed" ? (
          <CloseIcon sx={{ fontSize: 16, color: "fail" }} />
        ) : state === "active" ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="4" y1="14" x2="14" y2="4" stroke={theme.palette.blue} strokeWidth="2" />
          </svg>
        ) : (
          <Typography
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: state === "locked" ? "grid" : "text.secondary",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </Typography>
        )}
      </Box>

      {/* Step Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1.5 }}>
          <Typography
            variant="h6"
            sx={{
              color: state === "locked" ? "grid" : "text.primary",
            }}
          >
            {step.title}
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              color: state === "locked" ? theme.palette.grid : "text.secondary",
              whiteSpace: "nowrap",
            }}
          >
            {step.day}
          </Typography>
        </Box>

        {isExpanded && (
          <Box sx={{ mt: 1.25, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {step.description}
            </Typography>

            {step.enterpriseOnly && (
              <Chip
                label="ENTERPRISE ONLY"
                size="small"
                variant="outlined"
                sx={{
                  alignSelf: "flex-start",
                  fontSize: "0.625rem",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  color: "primary.main",
                  borderColor: "primary.main",
                  bgcolor: "blueLight",
                  height: 22,
                }}
              />
            )}

            <Typography
              sx={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "text.secondary",
              }}
            >
              {step.apiAction}
            </Typography>

            {result && (
              <Box sx={{ mt: 1, border: `1px solid ${theme.palette.grid}` }}>
                {result.result.checks.map((check: Check, ci: number) => (
                  <Box
                    key={ci}
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1,
                      px: 1.25,
                      py: 0.75,
                      fontSize: "0.75rem",
                      bgcolor: check.passed ? "passLight" : "failLight",
                      borderBottom: ci < result.result.checks.length - 1 ? `1px solid ${theme.palette.grid}` : "none",
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        flexShrink: 0,
                        width: 14,
                        textAlign: "center",
                        color: check.passed ? "pass" : "fail",
                      }}
                    >
                      {check.passed ? "+" : "−"}
                    </Typography>
                    <Typography component="span" sx={{ fontWeight: 500, fontSize: "0.75rem", color: "text.primary", whiteSpace: "nowrap" }}>
                      {check.label}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: "0.75rem",
                        color: "text.secondary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {check.detail}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
