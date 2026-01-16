using UnityEngine;
using System.Collections;

public class Stairs : MonoBehaviour
{
    public Transform portalA;
    public Transform portalB;

    public void PlayerEnterStairs(Transform entry, Player player)
    {
        if (player == null) return;

        Transform exit = (entry == portalA) ? portalB : portalA;
        Vector3 direction = Vector3.zero;
        direction.x = entry.position.x > exit.position.x ? -1 : 1;

        player.MoveStairs(exit.position, direction);
    }
}
