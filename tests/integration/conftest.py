import os

import pytest
from gltest import get_contract_factory


CONTRACT_PATH = "mandate_vault.py"


@pytest.fixture(scope="session")
def deployed_contract():
    address = os.environ.get("MANDATEVAULT_ADDRESS")
    if not address:
        pytest.skip(
            "MANDATEVAULT_ADDRESS not set - deploy first with "
            "`genlayer deploy --contract contracts/mandate_vault.py` "
            "and export the printed address."
        )
    factory = get_contract_factory(contract_file_path=CONTRACT_PATH)
    return factory.build_contract(contract_address=address)

