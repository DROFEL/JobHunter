import os

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


_initialized = False


def setup_tracing() -> None:
    global _initialized
    if _initialized:
        return
    endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
    service_name = os.environ.get("OTEL_SERVICE_NAME", __name__)
    try:
        provider = TracerProvider(resource=Resource.create({"service.name": service_name}))
        provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint, insecure=True)))
        trace.set_tracer_provider(provider)
        _initialized = True
    except Exception:
        pass


def get_tracer(name: str):
    return trace.get_tracer(name)
