import logging
import sys


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


def setup_logging(level=logging.INFO):
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(PrettyFormatter())
    root_logger.addHandler(handler)

    for logger in logging.root.manager.loggerDict.values():
        if isinstance(logger, logging.Logger):
            logger.handlers.clear()
            logger.propagate = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
