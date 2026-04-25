import logging
import os
import sys

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


class PrettyFormatter(logging.Formatter):
    def format(self, record):
        color = LEVEL_COLORS.get(record.levelname, "")
        level = f"{color}{record.levelname:<8}{RESET}"
        time  = f"{DIM}{self.formatTime(record, '%H:%M:%S')}{RESET}"
        name  = f"{DIM}{record.name}{RESET}"
        line  = f"{time}  {level}  {name}  {record.getMessage()}"

        if record.exc_info:
            line += "\n" + self.formatException(record.exc_info)

        return line


def _make_otel_handler(level: int) -> LoggingHandler | None:
    endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
    service_name = os.environ.get("OTEL_SERVICE_NAME", __name__)
    try:
        provider = LoggerProvider(resource=Resource.create({"service.name": service_name}))
        provider.add_log_record_processor(
            BatchLogRecordProcessor(OTLPLogExporter(endpoint=endpoint, insecure=True))
        )
        set_logger_provider(provider)
        handler = LoggingHandler(level=level, logger_provider=provider)
        return handler
    except Exception:
        return None


def setup_logging(level=logging.INFO):
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(PrettyFormatter())
    root_logger.addHandler(handler)

    otel_handler = _make_otel_handler(level)
    if otel_handler is not None:
        root_logger.addHandler(otel_handler)

    for logger in logging.root.manager.loggerDict.values():
        if isinstance(logger, logging.Logger):
            logger.handlers.clear()
            logger.propagate = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
