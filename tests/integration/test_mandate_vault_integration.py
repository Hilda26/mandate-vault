import pytest

pytestmark = pytest.mark.integration


def test_deployed_schema_exposes_mandate_vault_surface(deployed_contract):
    assert int(deployed_contract.vault_count(args=[]).call()) >= 0
    assert int(deployed_contract.proposal_count_total(args=[]).call()) >= 0

