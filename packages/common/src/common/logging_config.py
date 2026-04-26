import json
import logging
import sys

from opentelemetry import trace as _otrace
from opentelemetry._logs import set_logger_provider
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.resources import Resource


LEVEL_COLORS = {
    "DEBUG":    "\033[34m",
    "INFO":     "\033[32m",
    "WARNING":  "\033[33m",
    "ERROR":    "\033[31m",
    "CRITICAL": "\033[35m",
}
RESET = "\033[0m"
DIM   = "\033[2m"

_STANDARD_LOG_FIELDS = frozenset({
    "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
    "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
    "created", "msecs", "relativeCreated", "thread", "threadName",
    "processName", "process", "taskName", "message",
})


class PrettyFormatter(logging.Formatter):
    def format(self, record):
        color = LEVEL_COLORS.get(record.levelname, "")
        level = f"{color}{record.levelname:<8}{RESET}"
        time  = f"{DIM}{self.formatTime(record, '%H:%M:%S')}{RESET}"
        name  = f"{DIM}{record.name}{RESET}"

        span_ctx = _otrace.get_current_span().get_span_context()
        if span_ctx.is_valid:
            short_tid = f"{span_ctx.trace_id:032x}"[:8]
            tid = f"{DIM}[{short_tid}]{RESET} "
        else:
            tid = ""

        line = f"{time}  {level}  {name}  {tid}{record.getMessage()}"

        if record.exc_info:
            line += "\n" + self.formatException(record.exc_info)

        return line


class _JsonOtelHandler(LoggingHandler):
    def emit(self, record: logging.LogRecord) -> None:
        body: dict = {
            "message": record.getMessage(),
            "level": record.levelname,
            "logger": record.name,
            "path": f"{record.filename}:{record.lineno}",
            "func": record.funcName,
        }

        span_ctx = _otrace.get_current_span().get_span_context()
        if span_ctx.is_valid:
            body["trace_id"] = f"{span_ctx.trace_id:032x}"

        for k, v in record.__dict__.items():
            if k not in _STANDARD_LOG_FIELDS and not k.startswith("_"):
                try:
                    json.dumps(v)
                    body[k] = v
                except (TypeError, ValueError):
                    body[k] = str(v)

        orig_msg, orig_args = record.msg, record.args
        record.msg, record.args = json.dumps(body), None
        try:
            super().emit(record)
        finally:
            record.msg, record.args = orig_msg, orig_args


_otel_handler: _JsonOtelHandler | None = None


def _init_otel_handler(level: int) -> _JsonOtelHandler | None:
    from common.config import get_settings
    s = get_settings()
    endpoint = s.otel_exporter_otlp_endpoint
    service_name = s.otel_service_name or __name__
    try:
        provider = LoggerProvider(resource=Resource.create({"service.name": service_name}))
        provider.add_log_record_processor(
            BatchLogRecordProcessor(OTLPLogExporter(endpoint=endpoint, insecure=True))
        )
        set_logger_provider(provider)
        return _JsonOtelHandler(level=level, logger_provider=provider)
    except Exception:
        return None


def setup_logging(level=logging.INFO):
    global _otel_handler
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)

    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(PrettyFormatter())
    root_logger.addHandler(console)

    if _otel_handler is None:
        _otel_handler = _init_otel_handler(level)
        from common.tracing_config import setup_tracing
        setup_tracing()

    if _otel_handler is not None:
        _otel_handler.setLevel(level)
        root_logger.addHandler(_otel_handler)

    for logger in logging.root.manager.loggerDict.values():
        if isinstance(logger, logging.Logger):
            logger.handlers.clear()
            logger.propagate = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
